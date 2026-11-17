
import math
import re
import threading
import time

# Use the Windows certificate store for HTTPS (see llm.py).
import truststore
truststore.inject_into_ssl()

import requests

from database import SessionLocal, ServiceCentre


# --------------------------------------------------
# 1. SETTINGS
# --------------------------------------------------
# Map data comes from OpenStreetMap (free). Its search service,
# Nominatim, allows at most 1 request per second and asks every app
# to identify itself. We follow both rules.

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "SahayakAI/1.0 (student project; government scheme assistant)"}

# The official CSC locator, for CSCs not in our list.
CSC_LOCATOR_URL = "https://locator.csccloud.in/"

# What we look for near the user, and how we label it.
# Banks: KCC, Mudra, Stand-Up India, APY, PMJJBY are applied for at banks.
# Post offices: APY and insurance schemes, and many citizen services.
PLACE_TYPES = {
    "bank": "Bank",
    "post office": "Post office",
}

SEARCH_RADIUS_KM = 8

# Some private couriers are wrongly tagged as "post office" on the map.
NOT_A_POST_OFFICE = re.compile(r"courier|cargo|logistic|express|dtdc|blue ?dart|trackon|fedex|dhl", re.I)


# --------------------------------------------------
# 2. POLITE REQUESTS (MAX 1 PER SECOND)
# --------------------------------------------------

_lock = threading.Lock()
_last_request = 0.0


def nominatim(params):
    global _last_request

    with _lock:
        wait = 1.1 - (time.time() - _last_request)
        if wait > 0:
            time.sleep(wait)
        _last_request = time.time()

    response = requests.get(
        NOMINATIM_URL,
        params={**params, "format": "jsonv2", "countrycodes": "in"},
        headers=HEADERS,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


# --------------------------------------------------
# 3. CITY / PIN CODE -> MAP POSITION
# --------------------------------------------------

def find_location(place):
    """'Rohtak' or '124001' -> {"lat", "lon", "label"}, or None if not found."""

    place = place.strip()

    if re.fullmatch(r"\d{6}", place):
        results = nominatim({"postalcode": place, "limit": 1})
    else:
        results = nominatim({"q": place, "limit": 1})

    if not results:
        return None

    first = results[0]
    return {
        "lat": float(first["lat"]),
        "lon": float(first["lon"]),
        "label": first["display_name"].removesuffix(", India"),
    }


# --------------------------------------------------
# 4. DISTANCE BETWEEN TWO POINTS (HAVERSINE FORMULA)
# --------------------------------------------------

def distance_km(lat1, lon1, lat2, lon2):
    radius = 6371  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return radius * 2 * math.asin(math.sqrt(a))


# --------------------------------------------------
# 5. SEARCH OPENSTREETMAP NEAR A POINT
# --------------------------------------------------

def search_openstreetmap(lat, lon):
    # A box of about SEARCH_RADIUS_KM around the point (1 degree ~ 111 km).
    d = SEARCH_RADIUS_KM / 111
    box = f"{lon - d},{lat + d},{lon + d},{lat - d}"

    places = []

    for query, label in PLACE_TYPES.items():
        try:
            results = nominatim({
                "q": query, "viewbox": box, "bounded": 1, "limit": 15, "extratags": 1,
            })
        except requests.RequestException as error:
            print(f"OpenStreetMap search failed for {query!r}: {error}")
            continue

        for result in results:
            name = result.get("name") or label

            if label == "Post office" and NOT_A_POST_OFFICE.search(name):
                continue
            address = result["display_name"].removesuffix(", India")
            if address.startswith(name + ", "):
                address = address[len(name) + 2:]

            places.append({
                "name": name,
                "type": label,
                "address": address,
                "phone": (result.get("extratags") or {}).get("phone"),
                "lat": float(result["lat"]),
                "lon": float(result["lon"]),
                "source": "OpenStreetMap",
            })

    return places


# --------------------------------------------------
# 6. CENTRES ADDED BY THE ADMIN (OUR DATABASE)
# --------------------------------------------------

def search_database(lat, lon):
    db = SessionLocal()
    try:
        return [
            {
                "name": c.name,
                "type": c.centre_type,
                "address": c.address,
                "phone": c.phone,
                "lat": c.latitude,
                "lon": c.longitude,
                "source": "Added by Sahayak admin",
            }
            for c in db.query(ServiceCentre).all()
            if distance_km(lat, lon, c.latitude, c.longitude) <= SEARCH_RADIUS_KM * 2
        ]
    finally:
        db.close()


# --------------------------------------------------
# 7. FIND THE NEAREST CENTRES
# --------------------------------------------------
# Results are remembered for an hour, so searching the same place
# again is instant and does not call OpenStreetMap again.

_cache = {}
CACHE_SECONDS = 3600


def find_centres(lat, lon, limit=15):
    key = (round(lat, 2), round(lon, 2))   # about 1 km

    if key in _cache and time.time() - _cache[key][0] < CACHE_SECONDS:
        osm_places = _cache[key][1]
    else:
        osm_places = search_openstreetmap(lat, lon)
        _cache[key] = (time.time(), osm_places)

    centres = search_database(lat, lon) + osm_places

    for centre in centres:
        centre["distance_km"] = round(distance_km(lat, lon, centre["lat"], centre["lon"]), 1)

    centres.sort(key=lambda c: c["distance_km"])
    return centres[:limit]


def find_centres_near_place(place):
    """City or PIN -> (location, centres). location is None if not found."""

    location = find_location(place)

    if location is None:
        return None, []

    return location, find_centres(location["lat"], location["lon"])


# --------------------------------------------------
# 8. TEST
# --------------------------------------------------

if __name__ == "__main__":
    for place in ["Rohtak", "110001"]:
        start = time.time()
        location, centres = find_centres_near_place(place)
        print(f"\n{place} -> {location['label'] if location else 'NOT FOUND'} ({time.time() - start:.1f}s)")
        for c in centres[:6]:
            print(f"  {c['distance_km']:>4} km  {c['type']:<12} {c['name']} | {c['address'][:60]}")
