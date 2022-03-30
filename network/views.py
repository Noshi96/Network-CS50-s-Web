import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from datetime import datetime
from django.core.paginator import Paginator


from .models import User, Post, Follow, Like


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError as e:
            return render(request, "network/register.html", {
                "message": e
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def compose(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)

    post_content = data.get("post_content")

    post = Post(
        user = request.user,
        post_content = post_content
    )
    post.save()
    return JsonResponse({"message": "Post sent successfully."}, status=201)

def posts(request, page):
    posts = Post.objects.all()
    posts = posts.order_by("-timestamp").all()

    paginator = Paginator(posts, 10) # Show 10 contacts per page.

    current_page = page
    page_obj = paginator.get_page(int(current_page))

    previous = 0
    next = 0
    if (page_obj.has_previous()):
        previous = page_obj.previous_page_number()
    if (page_obj.has_next()):
        next = page_obj.next_page_number()

    if not request.user.id:
        user = 0
    else:
        user = request.user
        
    is_user_like_post_dict = {}
    like = 0
    for post in page_obj:
        
        if not post.like.filter(user=user):
            like = 0
        else:
            like = 1
        is_user_like_post_dict[post.id] = like

    return JsonResponse({
        "posts": [post.serialize() for post in page_obj],
        "current_user_id": request.user.id,
        "is_user_like_post_dict": is_user_like_post_dict,
        "page_obj":  {
            "has_previous": page_obj.has_previous(),
            "previous_page_number": previous,
            "has_next": page_obj.has_next(),
            "next_page_number": next,
            "current_page": current_page,
        }
        }, safe=False)

def user_profile(request, user_id, page):
    user = User.objects.get(pk=user_id)
    followers = Follow.objects.filter(followers__id=user.id)
    following = Follow.objects.filter(following__id=user.id)

    posts = Post.objects.filter(
            user=user
        )
    posts = posts.order_by("-timestamp").all()

    show_follow = True
    if(request.user.id == user_id):
        show_follow = False

    is_following = True
    following_check = Follow.objects.filter(followers=user, following=request.user.id)
    if len(following_check) == 0:
        is_following = False
        
    # return JsonResponse({
    #     "user": user.username,
    #     "followers": len(followers),
    #     "following": len(following),
    #     "posts": [post.serialize() for post in posts],
    #     "show_follow" : show_follow,
    #     "is_following":is_following,
    #     "user_profile_id": user_id
    # }, safe=False)

    paginator = Paginator(posts, 10) # Show 10 contacts per page.

    current_page = page
    page_obj = paginator.get_page(int(current_page))

    previous = 0
    next = 0
    if (page_obj.has_previous()):
        previous = page_obj.previous_page_number()
    if (page_obj.has_next()):
        next = page_obj.next_page_number()

    is_user_like_post_dict = {}
    like = 0
    for post in page_obj:
        if not post.like.filter(user=request.user):
            like = 0
        else:
            like = 1
        is_user_like_post_dict[post.id] = like

    return JsonResponse({
        "posts": [post.serialize() for post in page_obj],
        "user": user.username,
        "followers": len(followers),
        "following": len(following),
        "show_follow" : show_follow,
        "is_following":is_following,
        "user_profile_id": user_id,
        "user_id": request.user.id,
        "is_user_like_post_dict": is_user_like_post_dict,
        "page_obj":  {
            "has_previous": page_obj.has_previous(),
            "previous_page_number": previous,
            "has_next": page_obj.has_next(),
            "next_page_number": next,
            "current_page": current_page,
        }
        }, safe=False)

    

@login_required
@csrf_exempt
def follow_or_unfollow_user(request):

    if request.user.is_authenticated:
        if request.method == "POST":

            data = json.loads(request.body)
            user_id = data.get("user_id")

            current_user = User.objects.get(pk=request.user.id)
            second_user = User.objects.get(pk=user_id)

            following_each_other = Follow.objects.filter(followers=second_user, following=current_user)
            
            if not following_each_other:
                follow = Follow.objects.create(followers=second_user, following=current_user)
                follow.save()
                return JsonResponse({"message": "Added follow successfully."}, status=201)
            else:
                following_each_other.delete()
                return JsonResponse({"message": "Delated follow successfully."}, status=201)


def following_users_posts(request, page):

    # # Old method
    # for follow in following:
    #     posts = Post.objects.filter(user = follow.followers)
    #     for post in posts:
    #         following_posts.append(post)
    #date_format = '%Y-%m-%d %H:%M:%S.%f+00:00'
    #following_posts = sorted(following_posts, key=lambda x: datetime.strptime(str(x.timestamp), date_format), reverse=True)

    following_posts = Post.objects.filter(user__in = [follow.followers for follow in Follow.objects.filter(following__id=request.user.id)]).order_by("-timestamp").all()
    
    paginator = Paginator(following_posts, 10) # Show 10 contacts per page.
    page_obj = paginator.get_page(int(page))

    previous = 0
    next = 0
    if (page_obj.has_previous()):
        previous = page_obj.previous_page_number()
    if (page_obj.has_next()):
        next = page_obj.next_page_number()

    is_user_like_post_dict = {}
    like = 0
    for post in page_obj:
        if not post.like.filter(user=request.user):
            like = 0
        else:
            like = 1
        is_user_like_post_dict[post.id] = like

    return JsonResponse({
        "posts": [post.serialize() for post in page_obj],
        "is_user_like_post_dict": is_user_like_post_dict,
        "page_obj":  {
            "has_previous": page_obj.has_previous(),
            "previous_page_number": previous,
            "has_next": page_obj.has_next(),
            "next_page_number": next,
            "current_page": page,
        }
        }, safe=False)

@login_required
@csrf_exempt  
def edit_post(request, post_id, user_id):
    if (request.user.is_authenticated):
        if (request.user.id == user_id):
            if (request.method == "PUT"):
                data = json.loads(request.body)
                post = Post.objects.get(id=post_id)
                post.post_content = data["new_content"]
                post.save()
                return HttpResponse(status=204)

@login_required
@csrf_exempt 
def like_post(request):
    if (request.user.is_authenticated):
        if (request.method == "PUT"):
            data = json.loads(request.body)
            post = Post.objects.get(id=data["post_id"])
            user_liked_post = post.like.filter(user=request.user)
            if not user_liked_post:
                like = Like(user=request.user)
                like.save()
                post.like.add(like)
                return HttpResponse(status=205)
            else:
                post.like.remove(user_liked_post[0])
                return HttpResponse(status=206)
