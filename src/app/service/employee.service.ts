import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { Employee } from '../model/employee';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}
  searchCondition$ = new BehaviorSubject(null);
  addEmployee(employee: Employee) {
    return this.http.post<Employee>('/api/employee', employee).pipe(
      tap((response) => {
        this.employee$.next(response);
        this.employees$.next([response, ...this.employees$.value]);
        this.messageService.add({
          severity: 'success',
          summary: 'ข้อความ',
          detail: 'เพิ่มข้อมูลพนักงานเรียบร้อยแล้ว',
        });
      })
    );
  }

  editEmployee(employee: Employee) {
    return this.http.put<Employee>(`/api/employee`, employee).pipe(
      tap((response) => {
        this.employee$.next(response);
        // update Device[]
        this.employees$.next(
          this.employees$.value.map((table: Employee) =>
            table.id === response.id ? response : table
          )
        );
        this.messageService.add({
          severity: 'success',
          summary: 'ข้อความ',
          detail: 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว',
        });
      })
    );
  }

  hasTemps(): boolean {
    return this.employees$.getValue().length > 0;
  }

  private employee$ = new Subject<Employee>();
  getEmployee() {
    return this.employee$;
  }
  queryEmployeeById(id: number): void {
    let temp: Employee;
    console.log('this.employees$.getValue()', this.employees$.getValue());
    // ตรวจสอบว่ามีการค้นหา Employee[] มาแล้วหรือยัง
    if (this.hasTemps()) {
      // เลือก Employee จาก Employee[] ด้วยการใช้ filter
      temp =
        this.employees$.getValue().find((employee) => employee.id == id) ??
        ({} as Employee);
      // ส่ง Employee ที่หาได้เข้าไปที่ตัวแปร Obserable
      console.log('find Employee', temp);
      this.employee$.next(temp);
    } else {
      // ไม่มี Employee[] เก็บอยู่ให้ค้นมาจาก api
      this.http.get<Employee>(`/api/employee/${id}`).subscribe((response) => {
        // ส่ง Employee ที่หาได้เข้าไปที่ตัวแปร Obserable
        console.log('query Employee', response);
        this.employee$.next(response);
      });
    }
  }

  // ต้องการเก็บ employees[] เอาไว้เพื่อจะได้ไม่ต้อง query ใหม่
  private employees$ = new BehaviorSubject<Employee[]>([]);
  getEmployees() {
    return this.employees$;
  }

  queryEmployeesByCondition(employee: Employee) {
    let httpParams = new HttpParams();
    if (employee.firstName) {
      httpParams = httpParams.append('firstName', `%${employee.firstName}%`);
    }
    if (employee.lastName) {
      httpParams = httpParams.append('lastName', `%${employee.lastName}%`);
    }
    if (employee.gender) {
      httpParams = httpParams.append('gender', employee.gender);
    }
    if (employee.department) {
      httpParams = httpParams.append('department', employee.department.code);
    }
    return this.http
      .get<Employee[]>('/api/employee/search', { params: httpParams })
      .pipe(
        tap((response) => {
          this.employees$.next(response);
        })
      );
  }

  queryEmployees() {
    return this.http.get<Employee[]>('/api/employee/search').pipe(
      tap((response) => {
        this.employees$.next(response);
      })
    );
  }

  getIpAddress() {
    return this.http.get<any>('/api/employee/getIpAddress');
  }

  deleteEmployee(id: number) {
    return this.http.delete(`/api/employee/${id}`).pipe(
      tap(() => {
        this.employee$.next({} as Employee);
        this.employees$.next(
          // filter Employee[] ด้วย id แล้วเอา Employee[] ที่เหลือใส่เข้าไปที่ BehaviorSubject เพื่อ update Table
          this.employees$.value.filter(
            (employee: Employee) => employee.id !== id
          )
        );
        this.messageService.add({
          severity: 'success',
          summary: 'ข้อความ',
          detail: 'ลบข้อมูลพนักงานเรียบร้อยแล้ว',
        });
      })
    );
  }

  deleteEmployees(ids: number[]) {
    return this.http.delete('/api/employee', { body: ids }).pipe(
      tap(() => {
        this.employees$.next(
          // filter Employee[] ด้วย id แล้วเอา Employee[] ที่เหลือใส่เข้าไปที่ BehaviorSubject เพื่อ update Table
          this.employees$.value.filter(
            (employee: Employee) => !ids.includes(employee.id)
          )
        );
        this.messageService.add({
          severity: 'success',
          summary: 'ข้อความ',
          detail: 'ลบข้อมูลพนักงานเรียบร้อยแล้ว',
        });
      })
    );
  }

  get getCurrentDate() {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    return `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;
  }

  get getDateFormatReport() {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}
