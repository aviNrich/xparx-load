from pyspark.sql.functions import udf
from pyspark.sql.types import StringType, StructType, StructField
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


def normalize_name_udf(first_name, middle_name, last_name, full_name):
    def split_full_name(fn):
        if not fn:
            return (None, None, None)
        parts = fn.strip().split()
        if len(parts) == 0:
            return (None, None, None)
        first = parts[0]
        last = parts[-1] if len(parts) > 1 else None
        middle = " ".join(parts[1:-1]) if len(parts) > 2 else None
        return (first, middle, last)

    # Priority 1: If full_name is set, it wins - split it and use it
    if full_name and full_name.strip():
        first, middle, last = split_full_name(full_name)
        return (first, middle, last, full_name)

    # Priority 2: If any of first/middle/last are set, use them and build full_name
    if first_name or middle_name or last_name:
        # Use provided individual name parts
        first = first_name.strip() if first_name and first_name.strip() else None
        middle = middle_name.strip() if middle_name and middle_name.strip() else None
        last = last_name.strip() if last_name and last_name.strip() else None

        # Build full_name from parts
        name_parts = [p for p in [first, middle, last] if p]
        built_full_name = " ".join(name_parts) if name_parts else None

        return (first, middle, last, built_full_name)

    # If nothing is set, return all None
    return (None, None, None, None)


name_schema = StructType(
    [
        StructField("first_name", StringType()),
        StructField("middle_name", StringType()),
        StructField("last_name", StringType()),
        StructField("full_name", StringType()),
    ]
)

normalize_name_udf = udf(normalize_name_udf, name_schema)
