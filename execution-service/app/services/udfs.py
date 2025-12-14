from pyspark.sql.functions import udf
from pyspark.sql.types import StringType
import uuid


@udf(StringType())
def uuidv5_udf(value):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, value))
