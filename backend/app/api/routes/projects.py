from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_auth
from app.database.session import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreateRequest, ProjectResponse, ProjectUpdateRequest
from app.utils.slug import slugify

router = APIRouter()


def _to_response(project: Project, owner_username: str) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        is_public=project.is_public,
        board_type=project.board_type,
        code=project.code,
        components_json=project.components_json,
        wires_json=project.wires_json,
        owner_username=owner_username,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


async def _unique_slug(db: AsyncSession, user_id: str, base_slug: str) -> str:
    slug = base_slug or "project"
    counter = 1
    while True:
        result = await db.execute(
            select(Project).where(Project.user_id == user_id, Project.slug == slug)
        )
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


@router.get("/projects/me", response_model=list[ProjectResponse])
async def my_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth),
):
    result = await db.execute(
        select(Project).where(Project.user_id == user.id).order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()
    return [_to_response(p, user.username) for p in projects]


@router.post("/projects/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth),
):
    base_slug = slugify(body.name) or "project"
    slug = await _unique_slug(db, user.id, base_slug)

    project = Project(
        user_id=user.id,
        name=body.name,
        slug=slug,
        description=body.description,
        is_public=body.is_public,
        board_type=body.board_type,
        code=body.code,
        components_json=body.components_json,
        wires_json=body.wires_json,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _to_response(project, user.username)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if body.name is not None:
        project.name = body.name
        # Re-slug only if the name actually changed
        new_base = slugify(body.name)
        if new_base != project.slug:
            project.slug = await _unique_slug(db, user.id, new_base)
    if body.description is not None:
        project.description = body.description
    if body.is_public is not None:
        project.is_public = body.is_public
    if body.board_type is not None:
        project.board_type = body.board_type
    if body.code is not None:
        project.code = body.code
    if body.components_json is not None:
        project.components_json = body.components_json
    if body.wires_json is not None:
        project.wires_json = body.wires_json

    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return _to_response(project, user.username)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_auth),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden.")
    await db.delete(project)
    await db.commit()


@router.get("/user/{username}", response_model=list[ProjectResponse])
async def user_projects(
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.username == username))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found.")

    is_own = current_user and current_user.id == owner.id
    query = select(Project).where(Project.user_id == owner.id)
    if not is_own:
        query = query.where(Project.is_public == True)  # noqa: E712
    query = query.order_by(Project.updated_at.desc())

    projects = (await db.execute(query)).scalars().all()
    return [_to_response(p, owner.username) for p in projects]


@router.get("/user/{username}/{slug}", response_model=ProjectResponse)
async def get_project(
    username: str,
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.username == username))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found.")

    result2 = await db.execute(
        select(Project).where(Project.user_id == owner.id, Project.slug == slug)
    )
    project = result2.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    is_own = current_user and current_user.id == owner.id
    if not project.is_public and not is_own:
        raise HTTPException(status_code=403, detail="Forbidden.")

    return _to_response(project, owner.username)
