from datetime import datetime

from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = True
    board_type: str = "arduino-uno"
    code: str = ""
    components_json: str = "[]"
    wires_json: str = "[]"


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None
    board_type: str | None = None
    code: str | None = None
    components_json: str | None = None
    wires_json: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    is_public: bool
    board_type: str
    code: str
    components_json: str
    wires_json: str
    owner_username: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
