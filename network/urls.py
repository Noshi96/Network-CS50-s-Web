
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("compose_post", views.compose, name="compose"),
    path("posts/<int:page>", views.posts, name="posts"),
    path("user_profile/<int:user_id>/<int:page>", views.user_profile, name="user_profile"),
    path("follow_or_unfollow_user", views.follow_or_unfollow_user, name="follow_or_unfollow_user"),
    path("following_users_posts/<int:page>", views.following_users_posts, name="following_users_posts"),
    path("edit_post/<int:post_id>/<int:user_id>", views.edit_post, name="edit_post"),
    path("like_post", views.like_post, name="like_post")
    # path("posts/<int:post_id>", views.post, name="post")
]
