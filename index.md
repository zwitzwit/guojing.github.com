---
layout: default
title: Blog
---
{% for post in site.categories.blog %}
<div class="title"><a href="{{ post.url }}">{{ post.title }}</a></div>
<div class="content">
{{ post.content }}
</div>
{% endfor %}
