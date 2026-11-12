
from bs4 import BeautifulSoup
import re

def clean_text(text):
    """Normalize whitespace and fix a few known extraction artifacts."""
    text = re.sub(r"\s+", " ", text)

    # Fix known missing-space artifacts found on the source webpage.
    text = re.sub(r"(?i)guaranteesto\b", "guarantees to", text)
    text = re.sub(r"(?i)certifiedby\b", "certified by", text)
    text = re.sub(r"(?i)Non-BankingFinancial\b", "Non-Banking Financial", text)
    text = re.sub(r"(?i)eligibleMember\b", "eligible Member", text)
    text = re.sub(r"(?i)be\s+recognised", "be recognised", text)
    text = re.sub(r"(?i)loansextended\b", "loans extended", text)

    return text.strip()


def extract_faqs(html, source_url):
    """
    Extract FAQ question-answer pairs from a Startup India webpage.
    """

    soup = BeautifulSoup(html, "html.parser")

    # Find the Frequently Asked Questions heading.
    faq_heading = soup.find(
        ["h1", "h2", "h3", "h4"],
        string=lambda text: (
            text is not None
            and text.strip() == "Frequently Asked Questions"
        ),
    )

    # Return an empty list if the FAQ section doesn't exist.
    if faq_heading is None:
        return []

    # Find the container holding the FAQ section.
    section = faq_heading.find_parent("div", class_="col-md-12")

    if section is None:
        return []

    faq_items = section.select(".accordionitem")

    records = []

    for item in faq_items:
        question_element = item.select_one(".accordion-section-title")
        answer_element = item.select_one(".accordion-section-content")

        # Skip incomplete FAQ items.
        if not question_element or not answer_element:
            continue

        question = clean_text(question_element.get_text(" ", strip=True))
        answer = clean_text(answer_element.get_text(" ", strip=True))

        if not question or not answer:
            continue

        records.append({
            "section": "Frequently Asked Questions",
            "content_type": "faq",
            "question": question,
            "answer": answer,
            "content": f"Question: {question}\nAnswer: {answer}",
            "source_url": source_url,
        })

    return records


def extract_scheme_sections(html, source_url):
    """
    Extract individual content sections from a Startup India scheme page.
    """
    soup = BeautifulSoup(html, "html.parser")

    target_sections = {
        "Overview",
        "Operational Guidelines",
        "Eligibility",
        "How to Apply (For Startups)",
        "Online Application",
        "Offline Application",
        "Registration Process",
    }

    records = []

    for heading in soup.find_all(["h1", "h2", "h3", "h4"]):
        section_name = heading.get_text(" ", strip=True)

        if section_name not in target_sections:
            continue

        content_parts = []

        # Examine elements after this heading, stopping at the next heading.
        for element in heading.find_all_next():
            if element.name in ["h1", "h2", "h3", "h4"]:
                break

            # Ignore FAQ accordion content.
            if element.find_parent(class_="accordioncontainer"):
                continue

            if element.name in ["p", "li"]:
                text = clean_text(element.get_text(" ", strip=True))

                if text and text not in content_parts:
                    content_parts.append(text)

        content = " ".join(content_parts).strip()

        if not content:
            continue

        records.append({
            "section": section_name,
            "content_type": "section",
            "content": content,
            "source_url": source_url,
        })

    return records

def extract_all_content(html, source_url):
    """
    Extract scheme sections and FAQs into one list.
    """
    sections = extract_scheme_sections(html, source_url)
    faqs = extract_faqs(html, source_url)

    return sections + faqs


