# Approved sources for Sahayak AI ingestion.

SOURCE_REGISTRY = [
    {
        "source_id": "startup_india_schemes",
        "name": "Startup India - Central Government Schemes",
        "url": "https://www.startupindia.gov.in/content/sih/en/government-schemes.html",
        "organization": "Startup India",
        "source_type": "discovery_portal",
        "enabled": True,
    },
    {
        "source_id": "myscheme",
        "name": "myScheme - Government Scheme Discovery",
        "url": "https://www.myscheme.gov.in/",
        "organization": "National e-Governance Division",
        "source_type": "discovery_portal",
        "enabled": True,
    },
    {
        "source_id": "isti_startup_funding",
        "name": "India Science and Technology - Startup Funding",
        "url": "https://www.indiascienceandtechnology.gov.in/funding-opportunities-startups",
        "organization": "Government of India",
        "source_type": "discovery_portal",
        "enabled": True,
    },
    {
        "source_id": "nidhi_programmes",
        "name": "NIDHI - Schemes and Programmes",
        "url": "https://nidhi.dst.gov.in/schemes-programmes/",
        "organization": "Department of Science and Technology",
        "source_type": "programme_portal",
        "enabled": True,
    },
]


def get_enabled_sources():
    """Return sources enabled for ingestion."""
    return [
        source
        for source in SOURCE_REGISTRY
        if source["enabled"]
    ]


if __name__ == "__main__":
    sources = get_enabled_sources()

    print(f"Enabled sources: {len(sources)}")

    for source in sources:
        print(f"\n{source['source_id']}")
        print(f"Name: {source['name']}")
        print(f"URL: {source['url']}")