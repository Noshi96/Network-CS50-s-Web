from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Follow(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    followers = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers", default="", null=True)
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following", default="", null=True)

    def serialize(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "followers": self.followers.id,
            "following": self.following.id
        } 

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="like_owner")
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "user_name": self.user.username,
            "user_id": self.user.id
        } 

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_owner")
    post_content = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    like = models.ManyToManyField(Like, related_name="like", null=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "post_content": self.post_content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": len(self.like.all()),
            "user_id": self.user.id,
        }

    