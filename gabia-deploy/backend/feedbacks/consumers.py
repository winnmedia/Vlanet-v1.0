from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from users.models import User


class ChatConsumer(AsyncWebsocketConsumer):
    # async def connect(self):
    #     self.username = await self.get_name()
    #     # await database_sync_to_async(self.get_name)()

    # @database_sync_to_async
    # def get_name(self):
    #     user = User.objects.get(id=self.user_id)
    #     if user.nickname:
    #         return user.nickname
    #     else:
    #         return user.username

    # 연결됬을 때 실행되는 함수
    async def connect(self):
        # self.scope['url_route'] = /ws/localhost:8000/ws/chat/1
        self.feedback = self.scope["url_route"]["kwargs"]["feedback_id"]

        # 임의로 그룹명을 만든 과정 -> 수정가능
        self.feedback_group_name = "chat_%s" % self.feedback

        # Join room group -> group 연결된 소켓을 같은 그룹명에 연결
        # -> 같은 그룹명이면 같은 메세지 받음
        await self.channel_layer.group_add(self.feedback_group_name, self.channel_name)

        await self.accept()

    # 연결 해제 될때 실행되는 함수
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.feedback_group_name, self.channel_name
        )

    # 메세지를 보낼 때 실행
    async def receive(self, text_data):
        # receive react to django
        text_data_json = json.loads(text_data)
        # message = text_data_json["message"]
        await self.channel_layer.group_send(
            self.feedback_group_name,
            {"type": "chat_message", "message": text_data_json},
        )

    # 메세지를 받을 때 실행
    async def chat_message(self, event):
        # event => {"type": "chat_message", "message": text_data}임
        message = event["message"]
        # Send message to WebSocket django to react
        await self.send(text_data=json.dumps({"result": message}))
