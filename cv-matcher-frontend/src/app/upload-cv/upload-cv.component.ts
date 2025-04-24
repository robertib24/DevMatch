import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs'; // Necesită import

@Component({
  selector: 'app-upload-cv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-cv.component.html',
  styleUrls: ['./upload-cv.component.scss']
})
export class UploadCvComponent {
  // Proprietăți
  selectedFiles: File[] = [];
  // Folosim un tip mai precis pentru statusul upload-ului:
  // undefined = pending, number (0-100) = progress/success, -1 = error
  uploadProgress: { [fileName: string]: number | undefined } = {};
  uploadMessage: string | null = null;
  isError: boolean = false;
  uploading: boolean = false;

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // Metoda pentru selectarea fișierelor
  onFilesSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    // Resetare stare la fiecare selecție nouă
    this.selectedFiles = [];
    this.uploadMessage = null;
    this.isError = false;
    this.uploadProgress = {};

    if (fileList && fileList.length > 0) {
      let ignoredCount = 0;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          this.selectedFiles.push(file);
          this.uploadProgress[file.name] = undefined; // Marcat ca pending initial
        } else {
          console.warn(`Skipping non-docx file: ${file.name}`);
          ignoredCount++;
        }
      }
      // Setează mesaje informative
      if (this.selectedFiles.length === 0 && fileList.length > 0) {
          this.uploadMessage = "No valid .docx files selected.";
          this.isError = true;
      } else if (ignoredCount > 0) {
          this.uploadMessage = `Selected ${this.selectedFiles.length} valid .docx file(s). ${ignoredCount} non-docx file(s) were ignored.`;
          this.isError = false;
      }
    }
     // Resetează inputul pentru a permite reselectarea acelorași fișiere
     if(element) element.value = '';
  }

  // Metodă internă pentru upload-ul unui singur fișier
  private uploadSingleFile(file: File): Promise<boolean> {
     return new Promise((resolve) => {
          const formData = new FormData();
          formData.append('file', file, file.name);
          this.uploadProgress[file.name] = 0; // Start progres

          this.http.post<any>(`${this.apiUrl}/api/cvs/`, formData, {
            reportProgress: true,
            observe: 'events'
          }).subscribe({
            next: (event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.uploadProgress[file.name] = Math.round(100 * event.loaded / event.total);
              } else if (event instanceof HttpResponse) {
                 // Nu mai setăm la 100 aici, lăsăm finalizarea în Promise.all
                 resolve(true); // Succes
              }
            },
            error: (error: HttpErrorResponse) => {
              console.error(`Error uploading ${file.name}:`, error);
              this.uploadProgress[file.name] = -1; // Marcat ca eroare
              resolve(false); // Eșec
            }
          });
     });
  }

  // Metodă declanșată de butonul de upload
  async onUploadMultiple(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      this.uploadMessage = "Please select valid .docx files first.";
      this.isError = true;
      return;
    }

    this.uploading = true;
    this.uploadMessage = `Uploading ${this.selectedFiles.length} CV(s)...`;
    this.isError = false;

    // Rulează upload-urile în paralel
    const uploadPromises = this.selectedFiles.map(file => this.uploadSingleFile(file));
    const results = await Promise.all(uploadPromises);

    let successCount = 0;
    let errorCount = 0;
    results.forEach((success, index) => {
        const fileName = this.selectedFiles[index].name;
        if (success) {
            successCount++;
            // Asigură-te că progresul este 100% la succes final
            this.uploadProgress[fileName] = 100;
        } else {
            errorCount++;
            // Progresul este deja -1 din uploadSingleFile
        }
    });

    this.uploading = false;
    this.uploadMessage = `Upload complete. ${successCount} successful, ${errorCount} failed.`;
    this.isError = errorCount > 0;

    // Golește inputul de fișier după upload
    const fileInput = document.getElementById('cvFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    // Nu goli selectedFiles imediat, pentru ca utilizatorul să vadă statusul final
  }
}