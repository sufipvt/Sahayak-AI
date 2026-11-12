from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

from source_registry import get_enabled_sources


def fetch_page(url):
    response = requests.get(
        url,
        timeout=20,
        headers={
            "User-Agent": "SahayakAI/1.0 (Government scheme information assistant)"
        },
    )

    response.raise_for_status()
    return response.text


def extract_text(html):
    soup = BeautifulSoup(html, "html.parser")

    # Remove elements that usually don't contain useful page content.
    for element in soup(["script", "style", "noscript", "svg"]):
        element.decompose()

    return soup.get_text(separator=" ", strip=True)


if __name__ == "__main__":
    scheme_url = (
        "https://www.startupindia.gov.in/content/sih/en/"
        "credit-guarantee-scheme-for-startups.html"
    )

    try:
        html = fetch_page(scheme_url)
        soup = BeautifulSoup(html, "html.parser")

        faq_heading = soup.find(
            ["h1", "h2", "h3", "h4"],
            string=lambda text: (
                text is not None
                and text.strip() == "Frequently Asked Questions"
            ),
        )

        if faq_heading is None:
            print("FAQ heading not found.")
        else:
            section = faq_heading.find_parent("div", class_="col-md-12")
            faq_items = section.select(".accordionitem") if section else []

            print(f"FAQs found: {len(faq_items)}")

            for index, item in enumerate(faq_items, start=1):
                question_element = item.select_one(
                    ".accordion-section-title"
                )
                answer_element = item.select_one(
                    ".accordion-section-content"
                )

                if not question_element or not answer_element:
                    continue

                question = question_element.get_text(" ", strip=True)
                answer = answer_element.get_text(" ", strip=True)

                print(f"\n{'=' * 60}")
                print(f"FAQ {index}")
                print(f"Question: {question}")
                print(f"Answer: {answer}")

    except requests.RequestException as error:
        print(f"Fetch failed: {error}")
