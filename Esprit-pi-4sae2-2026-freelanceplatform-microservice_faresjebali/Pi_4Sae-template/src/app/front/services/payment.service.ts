import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse } from '../models/payment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private base = `${environment.businessApiGatewayUrl}/payment/api/payments`;

    constructor(private http: HttpClient) {}

    create(req: PaymentRequest): Observable<PaymentResponse> {
        return this.http.post<PaymentResponse>(this.base, req);
    }

    getById(id: number): Observable<PaymentResponse> {
        return this.http.get<PaymentResponse>(`${this.base}/${id}`);
    }

    listByContractId(contractId: number): Observable<PaymentResponse[]> {
        const params = new HttpParams().set('contractId', contractId);
        return this.http.get<PaymentResponse[]>(this.base, { params });
    }

    listByMilestoneId(milestoneId: number): Observable<PaymentResponse[]> {
        const params = new HttpParams().set('milestoneId', milestoneId);
        return this.http.get<PaymentResponse[]>(this.base, { params });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}
