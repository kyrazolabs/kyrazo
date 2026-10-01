import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { SupportTicket } from "../../models/support.types";

@Injectable({
  providedIn: "root",
})
export class SupportService {
  private readonly apiUrl = `${environment.baseUrl}/v1/support`;

  constructor(private http: HttpClient) {}

  createTicket(
    ticket: SupportTicket,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      this.apiUrl,
      ticket,
    );
  }
}
