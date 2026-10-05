"""Client for the Visio (Meet) external API."""

from logging import getLogger

from django.conf import settings

import requests

logger = getLogger(__name__)


class MeetError(Exception):
    """Raised when Visio cannot be reached or rejects a request."""


class MeetClient:
    """Create Visio rooms on behalf of a Hub user."""

    def _post(self, path, **kwargs):
        """POST to the external API and return the decoded JSON body."""
        url = f"{settings.MEET_API_URL.rstrip('/')}/{path}"
        try:
            response = requests.post(url, timeout=settings.MEET_API_TIMEOUT, **kwargs)
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError) as err:
            logger.error("Visio request to %s failed: %s", url, err)
            raise MeetError(f"Visio request to {path} failed") from err

    def _get_token(self, email):
        """Exchange the application credentials for a token delegated to `email`."""
        data = self._post(
            "application/token/",
            json={
                "client_id": settings.MEET_APPLICATION_CLIENT_ID,
                "client_secret": settings.MEET_APPLICATION_CLIENT_SECRET,
                "grant_type": "client_credentials",
                "scope": email,
            },
        )
        try:
            return data["access_token"]
        except (KeyError, TypeError) as err:
            raise MeetError("Visio returned no access token") from err

    def create_room(self, email):
        """Create a room owned by the user identified by `email`."""
        token = self._get_token(email)
        data = self._post(
            "rooms/",
            json={"access_level": settings.MEET_ROOM_ACCESS_LEVEL},
            headers={"Authorization": f"Bearer {token}"},
        )
        try:
            return {"id": data["id"], "url": data["url"]}
        except (KeyError, TypeError) as err:
            raise MeetError("Visio returned an incomplete room") from err
