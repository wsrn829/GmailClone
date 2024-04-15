from django.contrib import admin

from .models import User, Mail

# Register your models here.
admin.site.register(User)
admin.site.register(Mail)