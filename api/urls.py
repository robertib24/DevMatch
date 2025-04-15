from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVViewSet, JobDescriptionViewSet
from . import views

router = DefaultRouter()
router.register(r'cvs', CVViewSet)
router.register(r'jobs', JobDescriptionViewSet)

urlpatterns = [
    path('', views.api_home, name='api_home'),  # Ruta pentru funcția api_home
    path('api/', include(router.urls)),  # Rutele generate de router
]