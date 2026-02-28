// src/app/core/services/milestone.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MilestoneRequest, MilestoneResponse } from '../models/milestone.model';
import { Observable } from 'rxjs';
import {environment} from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class MilestoneService {
    private base = `${environment.apiGateway}/milestone/api`;

    constructor(private http: HttpClient) {}

    listByContractId(contractId: number): Observable<MilestoneResponse[]> {
        const params = new HttpParams().set('contractId', contractId);
        return this.http.get<MilestoneResponse[]>(this.base, { params });
    }

    getById(id: number): Observable<MilestoneResponse> {
        return this.http.get<MilestoneResponse>(`${this.base}/${id}`);
    }

    create(req: MilestoneRequest): Observable<MilestoneResponse> {
        return this.http.post<MilestoneResponse>(this.base, req);
    }

    update(id: number, req: MilestoneRequest): Observable<MilestoneResponse> {
        return this.http.put<MilestoneResponse>(`${this.base}/${id}`, req);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    approve(id: number): Observable<MilestoneResponse> {
        return this.http.patch<MilestoneResponse>(`${this.base}/${id}/approve`, {});
    }

    markPaid(id: number): Observable<MilestoneResponse> {
        // backend is POST
        return this.http.post<MilestoneResponse>(`${this.base}/${id}/mark-paid`, {});
    }
    submit(id: number) {
        return this.http.patch<MilestoneResponse>(`${this.base}/${id}/submit`, {});
    }
}