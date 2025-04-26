from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVViewSet, JobDescriptionViewSet, MatchResultViewSet, get_statistics

router = DefaultRouter()
router.register(r'cvs', CVViewSet)
router.register(r'jobs', JobDescriptionViewSet)
router.register(r'matches', MatchResultViewSet) 

urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', get_statistics, name='statistics'),
]