// order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Order {
  id: number;
  orderNumber: string;
  buyerId: number;
  sellerId: number;
  serviceId: number;
  service?: any;
  selectedAddOns?: string;
  totalPrice: number;
  status: OrderStatus;
  requirements?: string;
  requirementsAnswer?: string;
  deliveryMessage?: string;
  deliveryFileUrls?: string;
  revisionNotes?: string;
  revisionCount: number;
  maxRevisions: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  completedAt?: string;
}

export type OrderStatus = 
  | 'PENDING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'IN_REVISION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface CreateOrderRequest {
  serviceId: number;
  selectedAddOns?: string;
  totalPrice: number;
  requirements?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly BASE_URL = 'http://localhost:8085/microservice-service/api/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.BASE_URL, request, { headers: this.authHeaders() });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.BASE_URL}/${id}`, { headers: this.authHeaders() });
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.BASE_URL}/my-orders`, { headers: this.authHeaders() });
  }

  getMySales(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.BASE_URL}/my-sales`, { headers: this.authHeaders() });
  }

  getOrdersByService(serviceId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.BASE_URL}/service/${serviceId}`, { headers: this.authHeaders() });
  }

  submitRequirements(orderId: number, requirementsAnswer: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/requirements`,
      { requirementsAnswer },
      { headers: this.authHeaders() }
    );
  }

  deliverOrder(orderId: number, deliveryMessage: string, deliveryFileUrls?: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/deliver`,
      { deliveryMessage, deliveryFileUrls },
      { headers: this.authHeaders() }
    );
  }

  requestRevision(orderId: number, revisionNotes: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/revision`,
      { revisionNotes },
      { headers: this.authHeaders() }
    );
  }

  completeOrder(orderId: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/complete`,
      {},
      { headers: this.authHeaders() }
    );
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/cancel`,
      {},
      { headers: this.authHeaders() }
    );
  }

  disputeOrder(orderId: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.BASE_URL}/${orderId}/dispute`,
      {},
      { headers: this.authHeaders() }
    );
  }
}