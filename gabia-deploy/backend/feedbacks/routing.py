from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # url("ws/chat/<int:feedback>/<int:user_id>", consumers.ChatConsumer),
    path("ws/chat/<int:feedback_id>/", consumers.ChatConsumer.as_asgi()),
]
