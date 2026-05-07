import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CheckoutSessionResponse,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = `${environment.apiGateway}/payment/api/payments`;

  constructor(private readonly http: HttpClient) {}

  createCheckoutSession(req: PaymentRequest): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(`${this.base}/checkout-session`, req);
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

  release(id: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/${id}/release`, {});
  }

  requestRefund(id: number, req: RefundRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/${id}/refund`, req);
  }
}
