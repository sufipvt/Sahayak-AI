from content_extractor import extract_faqs, extract_scheme_sections
from test_parser import fetch_page
from content_extractor import extract_faqs
from content_extractor import clean_text


if __name__ == "__main__":
    scheme_url = (
        "https://www.startupindia.gov.in/content/sih/en/"
        "credit-guarantee-scheme-for-startups.html"
    )

    html = fetch_page(scheme_url)

    faqs = extract_faqs(html, scheme_url)

    print(f"FAQs extracted: {len(faqs)}")

    for faq in faqs:
        print("\n" + "=" * 50)
        print(f"Question: {faq['question']}")
        print(f"Answer: {faq['answer']}")
        print(f"Source: {faq['source_url']}")

    sections = extract_scheme_sections(html, scheme_url)

    print(f"\nSections extracted: {len(sections)}")

    for section in sections:
        print("\n" + "=" * 50)
        print(f"Section: {section['section']}")
        print(f"Content length: {len(section['content'])} characters")
        print(f"Content: {section['content']}")
        print(f"Source: {section['source_url']}")

