from pyspark.sql.functions import udf
from pyspark.sql.types import StringType
import uuid
import re


@udf(StringType())
def uuidv5_udf(value):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, value))


@udf(StringType())
def uuidv4_udf():
    return str(uuid.uuid4())


@udf(StringType())
def normalize_gender(raw):
    if raw is None:
        return None

    s = raw.strip().lower()
    s = re.sub(r"[^a-z\s\-]", "", s)

    rules = [
        (r"\bintersex\b", "Intersex"),
        (r"\b(non[\s\-]?binary|enby|nb)\b", "Non-Binary"),
        (r"\b(gender[\s\-]?fluid|fluid)\b", "Genderfluid"),
        (r"\b(a[\s\-]?gender)\b", "Agender"),
        (r"\b(transgender|trans\b|mtf|ftm)\b", "Trans"),
        (r"\blesbian\b", "Lesbian"),
        (r"\bgay\b", "Gay"),
        (r"\b(queer|lgbtq?|lgbtqia)\b", "Queer"),
        (r"\b(female|woman|girl|f)\b", "Female"),
        (r"\b(male|man|boy|m)\b", "Male"),
        (r"\b(other|prefer not|unknown|unsure|na|n\/a)\b", "Other"),
    ]

    for pattern, label in rules:
        if re.search(pattern, s):
            return label

    return "Other"
