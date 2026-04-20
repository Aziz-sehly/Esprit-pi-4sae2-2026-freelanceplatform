import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AnalyzeMediaItemRequest, MediaAnalysisResultDto } from '../models/communication';

@Injectable({ providedIn: 'root' })
export class MediaAnalysisPlatformService {
  private readonly batchUrl = `${environment.mediaAnalysisApiBase}/api/media/analyze-batch`;

  constructor(private readonly http: HttpClient) {}

  analyzeBatch(items: AnalyzeMediaItemRequest[]): Observable<MediaAnalysisResultDto[]> {
    return this.http.post<MediaAnalysisResultDto[]>(this.batchUrl, items).pipe(
      catchError((err) => {
        console.error('MediaAnalysisPlatformService.analyzeBatch:', err);
        throw err;
      })
    );
  }
}
