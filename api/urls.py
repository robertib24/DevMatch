from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVViewSet, JobDescriptionViewSet

router = DefaultRouter()
router.register(r'cvs', CVViewSet)
router.register(r'jobs', JobDescriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]