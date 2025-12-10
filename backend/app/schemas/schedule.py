from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime


class IntervalConfig(BaseModel):
    value: int
    unit: Literal['minutes', 'hours', 'days']


class DailyConfig(BaseModel):
    time: str  # "HH:MM" format


class WeeklyConfig(BaseModel):
    days: list[Literal['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']]
    time: str  # "HH:MM" format


class ScheduleCreate(BaseModel):
    mapping_id: str
    mode: Literal['once', 'scheduled']
    schedule_type: Optional[Literal['interval', 'daily', 'weekly', 'cron']] = None
    interval: Optional[IntervalConfig] = None
    daily: Optional[DailyConfig] = None
    weekly: Optional[WeeklyConfig] = None
    cron_expression: Optional[str] = None
    enabled: bool = True


class ScheduleResponse(ScheduleCreate):
    id: str = Field(alias='_id')
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)
