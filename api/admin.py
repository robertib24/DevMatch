from django.contrib import admin
from .models import CV, JobDescription, MatchResult

class CVAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'processed_at')
    search_fields = ('name', 'content')
    readonly_fields = ('processed_at',)
    list_filter = ('processed_at',)
    
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'industry', 'created_at')
    search_fields = ('title', 'content', 'industry')
    readonly_fields = ('created_at',)
    list_filter = ('industry', 'created_at')

class MatchResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_cv_name', 'get_job_title', 'total_score', 'matched_at')
    list_filter = ('matched_at',)
    search_fields = ('cv__name', 'job__title')
    readonly_fields = ('matched_at',)
    
    def get_cv_name(self, obj):
        return obj.cv.name
    get_cv_name.short_description = 'CV'
    get_cv_name.admin_order_field = 'cv__name'
    
    def get_job_title(self, obj):
        return obj.job.title
    get_job_title.short_description = 'Job'
    get_job_title.admin_order_field = 'job__title'

admin.site.register(CV, CVAdmin)
admin.site.register(JobDescription, JobDescriptionAdmin)
admin.site.register(MatchResult, MatchResultAdmin)