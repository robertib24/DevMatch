import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-upload-job',
  standalone: true,
  imports: [CommonModule], // Nu mai e nevoie de FormsModule
  templateUrl: './upload-job.component.html',
  // Refolosim stilurile + adăugăm cele specifice
  styleUrls: ['./upload-job.component.scss', '../upload-cv/upload-cv.component.scss']
})
// !!! NUMELE CORECT AL CLASEI !!!
export class UploadJobComponent {
   // Proprietăți similare cu UploadCvComponent
  selectedFiles: File[] = [];
  uploadProgress: { [fileName: string]: number | undefined } = {};
  // Folosim submitMessage aici, cum era definit și în HTML-ul anterior
  submitMessage: string | null = null;
  isError: boolean = false;
  uploading: boolean = false;

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // Metoda onFilesSelected este identică cu cea din UploadCvComponent
  onFilesSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.selectedFiles = [];
    this.submitMessage = null; // Folosim submitMessage aici
    this.isError = false;
    this.uploadProgress = {};

    if (fileList && fileList.length > 0) {
      let ignoredCount = 0;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
         // Poți păstra validarea .docx sau o poți elimina dacă accepți și altceva
         if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
           this.selectedFiles.push(file);
           this.uploadProgress[file.name] = undefined;
         } else {
           console.warn(`Skipping non-docx file: ${file.name}`);
           ignoredCount++;
         }
      }
      if (this.selectedFiles.length === 0 && fileList.length > 0) {
          this.submitMessage = "No valid .docx files selected."; // Folosim submitMessage
          this.isError = true;
      } else if (ignoredCount > 0) {
          this.submitMessage = `Selected ${this.selectedFiles.length} valid .docx file(s). ${ignoredCount} non-docx file(s) were ignored.`; // Folosim submitMessage
          this.isError = false;
      }
    }
    if(element) element.value = '';
  }

  // Metodă internă specifică pentru upload job (alt endpoint)
  private uploadSingleJobFile(file: File): Promise<boolean> {
     return new Promise((resolve) => {
          const formData = new FormData();
          formData.append('file', file, file.name); // Backend trebuie să aștepte câmpul 'file'
          this.uploadProgress[file.name] = 0;

          // !!! Endpoint diferit: /api/jobs/ !!!
          this.http.post<any>(`${this.apiUrl}/api/jobs/`, formData, {
            reportProgress: true,
            observe: 'events'
          }).subscribe({
            next: (event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.uploadProgress[file.name] = Math.round(100 * event.loaded / event.total);
              } else if (event instanceof HttpResponse) {
                 resolve(true); // Succes
              }
            },
            error: (error: HttpErrorResponse) => {
              console.error(`Error uploading job ${file.name}:`, error);
               // Afișează eroarea specifică din backend
               const detail = error.error?.detail || error.message || 'Backend processing error';
               // Setează un mesaj specific erorii per fișier, dacă e posibil
               // this.submitMessage = `Error processing ${file.name}: ${detail}`; // Atenție, suprascrie mesajul general
               this.isError = true; // Setează isError general la true dacă apare vreo eroare
              this.uploadProgress[file.name] = -1; // Marchează fișierul ca eroare
              resolve(false); // Eșec
            }
          });
     });
  }

  // Metodă declanșată de buton (similară, dar apelează altă funcție internă)
  async onUploadMultipleJobs(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      this.submitMessage = "Please select valid job description files (.docx) first.";
      this.isError = true;
      return;
    }

    this.uploading = true;
    this.submitMessage = `Uploading ${this.selectedFiles.length} job(s)...`; // Folosim submitMessage
    this.isError = false; // Resetează eroarea generală la început

    const uploadPromises = this.selectedFiles.map(file => this.uploadSingleJobFile(file));
    const results = await Promise.all(uploadPromises);

    let successCount = 0;
    let errorCount = 0;
    results.forEach((success, index) => {
        const fileName = this.selectedFiles[index].name;
        if (success) {
            successCount++;
            this.uploadProgress[fileName] = 100;
        } else {
            errorCount++;
            // Progresul e deja -1
        }
    });

    this.uploading = false;
    // Afișează un mesaj final sumar. Erorile specifice ar trebui să fie vizibile în statusul fișierelor.
    if (errorCount > 0) {
         this.submitMessage = `Upload process finished. ${successCount} successful, ${errorCount} failed. See file status or console for details.`;
    } else {
         this.submitMessage = `Upload complete. ${successCount} job(s) successfully processed.`;
    }
    this.isError = errorCount > 0; // Setează statusul general final

    const fileInput = document.getElementById('jobFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    // Nu goli selectedFiles imediat
  }
}