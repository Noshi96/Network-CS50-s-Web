document.addEventListener('DOMContentLoaded', function() {
    show_all_posts(1);
    document.querySelector('#show_all_posts').addEventListener('click', ()=>{
      show_all_posts(1);
    });
    document.querySelector('#postbutton').addEventListener('click', send_post);
    document.querySelector('#user_profile_link').addEventListener('click', function(){
      show_user_profile(this.dataset.user_id, 1);
    });

    document.querySelector('#user_following_link').addEventListener('click', ()=>{
      show_all_following_posts(1);
    });
    
});

function is_empty(str){
    return (!str || str.length === 0 );
  }

function send_post(){

    const wrapper = document.querySelector(".wrapper");
    const editableInput = wrapper.querySelector(".editable");
    const content = editableInput.innerHTML;

    if (is_empty(content)){
      return false;
    }

    document.querySelector(".wrapper").querySelector(".editable").innerHTML="";

    fetch('/compose_post', {
      method: 'POST',
      body: JSON.stringify({
        post_content: content
      })
    })
    .then(response => response.json())
    .then(() => {
        document.querySelector('#display-posts').innerHTML="";
        show_all_posts(1);
        return false;
    });
  return false;
  }

  function show_all_posts(page){
    document.querySelector('#navigation-center-div').innerHTML="";
    document.querySelector('#user_profile_view').style.display='none';
    document.querySelector('#display-posts').style.display='block';
    document.querySelector('#compose-view').style.display='flex';
    document.querySelector('h2').innerHTML = "All Posts";
    document.querySelector('#display-posts').innerHTML="";

    fetch(`/posts/${page}`)
    .then(response => response.json())
    .then(data => {
        data.posts.forEach( post => {
            create_post_element(post, data.current_user_id, data.is_user_like_post_dict);
      }
      );
      create_navigation_elements(data.page_obj, "show_all_posts", 0);
    });
  return false;
  }

  function create_navigation_elements(page_obj, destination, user_id){
    
    const nav_aria_label = document.createElement('nav');
    nav_aria_label.ariaLabel="Page navigation";
    const ul_pagination = document.createElement('ul');
    ul_pagination.className="pagination";

    if (page_obj.has_previous){
      const previous_li = document.createElement('li');
      previous_li.className="page-item";
      const previous_a = document.createElement('a');
      previous_a.className="page-link";
      previous_a.href=`#`;
      previous_a.innerHTML="Previous";

      previous_li.append(previous_a);
      previous_a.addEventListener('click', ()=>{

        if (destination==="show_all_posts"){
          show_all_posts(page_obj.previous_page_number);
        } else if(destination==="show_all_following_posts"){
          show_all_following_posts(page_obj.previous_page_number);
        } else if(destination==="show_user_profile"){
          show_user_profile(user_id, page_obj.previous_page_number)
        }
        
      });
      ul_pagination.append(previous_li);
    } 

    if (page_obj.has_next){
      const next_li = document.createElement('li');
      next_li.className="page-item";
      const next_a = document.createElement('a');
      next_a.className="page-link";
      next_a.href=`#`;
      next_a.innerHTML="Next";

      next_li.append(next_a);
      next_a.addEventListener('click', ()=>{

        if (destination==="show_all_posts"){
          show_all_posts(page_obj.next_page_number);
        } else if(destination==="show_all_following_posts"){
          show_all_following_posts(page_obj.next_page_number);
        } else if(destination==="show_user_profile"){
          show_user_profile(user_id, page_obj.next_page_number)
        }

      });
      ul_pagination.append(next_li);
    }
    nav_aria_label.append(ul_pagination);
    document.querySelector('#navigation-center-div').append(nav_aria_label);
    return false
  }

  function create_post_element(post, current_user_id, is_user_like_post_dict){

    const post_element = document.createElement('div');
    post_element.className = "row";
    const edit_button = document.createElement('button');
    edit_button.className="btn btn-primary btn-sm";
    edit_button.id="edit_button";
    edit_button.innerHTML="Edit Post";

    post_element.innerHTML = `
        <div class="tweet-wrap">
            <div class="tweet-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" alt="" class="avatar">
                <div id="tweet-header-info-id" class="tweet-header-info">
                    <a id="post_owner">${post.user}</a> <span>@${post.user}</span>
                    <span>. ${post.timestamp}
                    </span>
                    <p>${post.post_content}</p>
                </div>
            </div>
            <div id="tweet_info" class="tweet-info-counts">
                <div class="likes">
                    <svg id="like_heart" class="feather feather-heart sc-dnqmqq jxshSx" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <div id="like_count" class="likes-count2">
                    ${post.likes}
                    </div>
                </div>
            </div>
        </div>
    `;

    

    post_element.querySelector('#post_owner').addEventListener('click', function(){
      show_user_profile(post.user_id, 1)
    });

    post_element.querySelector('#like_heart').addEventListener('click', ()=>{
      var like_count = parseInt(post_element.querySelector('#like_count').innerHTML);
      fetch(`/like_post`, {
        method: "PUT",
        body: JSON.stringify({
          post_id: post.id
        })
      }).then(()=>{
        if (is_user_like_post_dict[post.id] === 0){
          if (like_count < post.likes + 1){
            post_element.querySelector('#like_count').innerHTML = post.likes + 1;
          } else {
            post_element.querySelector('#like_count').innerHTML = post.likes;
          }      
        } else {
          if (like_count > post.likes - 1){
            post_element.querySelector('#like_count').innerHTML = post.likes - 1;
          } else {
            post_element.querySelector('#like_count').innerHTML = post.likes;
          }   
        }
      });
    });


    if (current_user_id==post.user_id){
      post_element.querySelector('#tweet_info').append(edit_button);

      var edited_post_textarea_content = ""
      edit_button.addEventListener('click', ()=>{
        if (edited_post_textarea_content===""){
          edited_post_textarea_content = post.post_content;
        }
        if (edit_button.id === "edit_button"){
          edit_button.innerHTML="Save";
          edit_button.id="save_button";

          post_element.querySelector('#tweet-header-info-id').innerHTML="";
          post_element.querySelector('#tweet-header-info-id').innerHTML=`
            <a id="post_owner">${post.user}</a> <span>@${post.user}</span>
            <span>. ${post.timestamp}
            </span>
            <textarea class="form-control" id="edit_post_textarea">${edited_post_textarea_content}</textarea>
          `;

        } else {
          edit_button.innerHTML="Edit Post";
          edit_button.id="edit_button";

          edited_post_textarea_content = post_element.querySelector('#edit_post_textarea').value;
          fetch(`/edit_post/${post.id}/${post.user_id}`,{
            method: 'PUT',
            body: JSON.stringify({
              new_content: edited_post_textarea_content
            })
          })
          .then(()=> {
            post_element.querySelector('#tweet-header-info-id').innerHTML="";
            post_element.querySelector('#tweet-header-info-id').innerHTML=`
              <a id="post_owner">${post.user}</a> <span>@${post.user}</span>
              <span>. ${post.timestamp}
              </span>
              <p>${edited_post_textarea_content}<p>
            `;
          });
        }   
      });
    }


    document.querySelector('#display-posts').append(post_element);
    return false;
  }

  function show_user_profile(user_id, page){

    document.querySelector('#navigation-center-div').innerHTML="";
    document.querySelector('#compose-view').style.display='none';
    document.querySelector('#user_profile_view').style.display='block';
    document.querySelector('#display-posts').style.display='block';
    document.querySelector('#display-posts').innerHTML="";
    document.querySelector('#user_profile_view').innerHTML="";
    document.querySelector('.left-up-header').innerHTML = "Profile";

    fetch(`/user_profile/${user_id}/${page}`)
    .then(response => response.json())
    .then(user => {
      create_user_profile_element(user);
      
      user.posts.forEach( post => {
        create_post_element(post, user.user_id, user.is_user_like_post_dict);
      });
      create_navigation_elements(user.page_obj, "show_user_profile", user_id);
    });
  return false;
  }

  function create_user_profile_element(user){

    const profile_element = document.createElement('div');
    profile_element.className = "profile";

    const follow_button = document.createElement('button');
    
    if (user.is_following){
      follow_button.innerHTML="Unfollow";
      follow_button.className = "btn btn-secondary";
    } else {
      follow_button.innerHTML="Follow";
      follow_button.className = "btn btn-primary";
    }
    
    follow_button.id = "follow_button";
    follow_button.type = "submit";
    

    profile_header = document.createElement('div');
    profile_header.className="profile-header";
    profile_header.innerHTML = `
      <div class="profile-header-info">
            ${user.user}
            <br>
            <span>@${user.user}</span>
            <div class="follow">
                <div class="following">
                  ${user.following} <span>Following</span>
                </div>
                <div class="followers">
                ${user.followers} <span>Followers</span>
                </div>
            </div>
          </div>
          `;

    profile_element.innerHTML= `
      <div class="profile-wrap">
        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" alt="" class="avatar">
      </div>
      `;

    if (user.show_follow){
      profile_element.querySelector('.profile-wrap').append(follow_button);
    }

    profile_element.querySelector('.profile-wrap').append(profile_header);
    document.querySelector('#user_profile_view').append(profile_element);

    follow_button.addEventListener('click', () =>{
      fetch('follow_or_unfollow_user', {
        method:'POST',
        body: JSON.stringify({
          user_id: user.user_profile_id
        })
      })
      .then(() => {
        show_user_profile(user.user_profile_id, 1);
      });
    });

    return false;
  }


  function show_all_following_posts(page){

    document.querySelector('#navigation-center-div').innerHTML="";
    document.querySelector('#compose-view').style.display='none';
    document.querySelector('#user_profile_view').style.display='none';
    document.querySelector('#display-posts').style.display='block';
    document.querySelector('#display-posts').innerHTML="";
    document.querySelector('.left-up-header').innerHTML = "Following";
    fetch(`/following_users_posts/${page}`)
    .then(response => response.json())
    .then(data => {
      data.posts.forEach( post => {
            create_post_element(post, 0, data.is_user_like_post_dict);
      }
      );
      create_navigation_elements(data.page_obj, "show_all_following_posts", 0);
    });
  return false;
  }