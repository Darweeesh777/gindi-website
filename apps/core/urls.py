from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, {'lang': 'en'}, name='home'),
    path('ar/', views.home, {'lang': 'ar'}, name='home_ar'),
    path('projects/', views.projects_index, {'lang': 'en'}, name='projects'),
    path('ar/projects/', views.projects_index, {'lang': 'ar'}, name='projects_ar'),
    path('projects/<slug:slug>/', views.project_detail, {'lang': 'en'}, name='project'),
    path('ar/projects/<slug:slug>/', views.project_detail, {'lang': 'ar'}, name='project_ar'),
    path('about/', views.about_page, {'lang': 'en'}, name='about'),
    path('ar/about/', views.about_page, {'lang': 'ar'}, name='about_ar'),
    path('services/', views.services_page, {'lang': 'en'}, name='services'),
    path('ar/services/', views.services_page, {'lang': 'ar'}, name='services_ar'),
    path('contact/', views.contact_page, {'lang': 'en'}, name='contact'),
    path('ar/contact/', views.contact_page, {'lang': 'ar'}, name='contact_ar'),
    path('free-tools/', views.free_tools, {'lang': 'en'}, name='free_tools'),
    path('ar/free-tools/', views.free_tools, {'lang': 'ar'}, name='free_tools_ar'),
    path('free-tools/<slug:slug>/', views.free_tool, {'lang': 'en'}, name='free_tool'),
    path('ar/free-tools/<slug:slug>/', views.free_tool, {'lang': 'ar'}, name='free_tool_ar'),
    # The earlier single-tool page now lives in the overview.
    path('free-estimate/', RedirectView.as_view(pattern_name='core:free_tools', permanent=True)),
    path('ar/free-estimate/', RedirectView.as_view(pattern_name='core:free_tools_ar', permanent=True)),
]
