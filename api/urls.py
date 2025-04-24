from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVViewSet, JobDescriptionViewSet, get_statistics

router = DefaultRouter()
router.register(r'cvs', CVViewSet)
router.register(r'jobs', JobDescriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', get_statistics, name='statistics'),
]