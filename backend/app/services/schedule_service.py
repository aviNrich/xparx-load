from pymongo.database import Database
from typing import Optional
from datetime import datetime
from ..schemas.schedule import ScheduleCreate, ScheduleResponse


class ScheduleService:
    def __init__(self, db: Database):
        self.db = db
        self.schedules = db.schedules

    def create_or_update_schedule(self, config: ScheduleCreate) -> ScheduleResponse:
        """Create or update schedule configuration"""
        config_dict = config.model_dump()
        now = datetime.utcnow()

        # Check if schedule already exists for this mapping
        existing = self.schedules.find_one({"mapping_id": config.mapping_id})

        if existing:
            # Update existing
            config_dict["updated_at"] = now
            self.schedules.update_one(
                {"mapping_id": config.mapping_id},
                {"$set": config_dict}
            )
            result = self.schedules.find_one({"mapping_id": config.mapping_id})
        else:
            # Create new
            config_dict["created_at"] = now
            config_dict["updated_at"] = now
            insert_result = self.schedules.insert_one(config_dict)
            result = self.schedules.find_one({"_id": insert_result.inserted_id})

        result["_id"] = str(result["_id"])
        return ScheduleResponse(**result)

    def get_schedule(self, mapping_id: str) -> Optional[ScheduleResponse]:
        """Get schedule by mapping_id"""
        schedule = self.schedules.find_one({"mapping_id": mapping_id})
        if not schedule:
            return None
        schedule["_id"] = str(schedule["_id"])
        return ScheduleResponse(**schedule)
