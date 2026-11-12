import requests

from source_registry import get_enabled_sources


def fetch_page(url):
    response = requests.get(
        url,
        timeout=20,
        headers={
            "User-Agent": "SahayakAI/1.0 (Government scheme information assistant)"
        }
    )

    response.raise_for_status()

    return response


if __name__ == "__main__":
    sources = get_enabled_sources()
    source = sources[0]

    print(f"Testing source: {source['name']}")
    print(f"URL: {source['url']}")

    try:
        response = fetch_page(source["url"])

        print(f"\nHTTP status: {response.status_code}")
        print(f"Content type: {response.headers.get('Content-Type')}")
        print(f"Response size: {len(response.content)} bytes")
        print("\nFirst 300 characters:")
        print(response.text[:300])

    except requests.RequestException as error:
        print(f"\nFetch failed: {error}")