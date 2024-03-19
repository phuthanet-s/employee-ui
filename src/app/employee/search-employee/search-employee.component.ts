import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subscription, debounceTime, switchMap } from 'rxjs';
import { Department } from 'src/app/model/department';
import { Employee } from 'src/app/model/employee';
import { DepartmentService } from 'src/app/service/department.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { Gender } from 'src/app/type/gender';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-search-employee',
  templateUrl: './search-employee.component.html',
  styleUrls: ['./search-employee.component.scss'],
})
export class SearchEmployeeComponent implements OnInit, OnDestroy {
  departments: Department[] = [];
  Gender = Gender;

  subscribeDepartment!: Subscription;
  subscribeEmployees!: Subscription;
  loading: boolean = false;

  employees: Employee[] = [];
  selectedEmployees: Employee[] = [];
  employeesSecon: Employee[] = [];
  selectedEmployeesSecon: Employee[] = [];

  isLoading: boolean = false; // คุมการทำงานของปุ่ม ว่าให้ขึ้น loading หรือไม่

  employeeForm: FormGroup = new FormGroup({
    id: new FormControl(),
    firstName: new FormControl(null),
    lastName: new FormControl(null),
    gender: new FormControl(Gender.MALE),
    department: new FormControl(null),
  });

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.departmentService.callApiGetDepartment();
    this.subscribeDepartment = this.departmentService
      .getDepartment()
      .subscribe((response) => {
        this.departments = response;
      });
    if (this.employeeService.searchCondition$.value) {
      this.employeeForm.patchValue(this.employeeService.searchCondition$.value);
      this.onSearch();
    }

    // this.subscribeEmployees = this.employeeService
    //   .getEmployees()
    //   .subscribe((employees) => {
    //     this.employees = employees;
    //   });

    //https://www.credera.com/insights/using-rxjs-switchmap-angular-7-reactive-forms-cancel-pending-requests
    // this.employeeForm.valueChanges
    //   .pipe(
    //     debounceTime(200),
    //     switchMap(() =>
    //       this.employeeService.queryEmployees(this.employeeForm.value)
    //     )
    //   )
    //   .subscribe();
  }

  ngOnDestroy(): void {
    this.subscribeDepartment.unsubscribe();
    // this.subscribeEmployees.unsubscribe();
  }

  gotoSave() {
    this.router.navigate(['/employee/save']);
  }

  deleteEmployees() {
    if (this.selectedEmployees.length > 0) {
      this.isLoading = true;
      const ids: number[] = this.selectedEmployees.map((employee) => {
        return employee.id;
      });
      this.employeeService.deleteEmployees(ids).subscribe(() => {
        this.isLoading = false;
        this.selectedEmployees = [];
        this.onSearch();
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select more than 1 option.',
      });
    }
  }

  resetForm() {
    this.employeeForm.reset({
      gender: Gender.MALE,
    });
    this.employees = [];
    this.employeesSecon = [];
    this.employeeService.searchCondition$.next(null);
  }

  onSearch() {
    this.loading = true;
    this.employeeService.searchCondition$.next(this.employeeForm.value);
    this.employeeService
      .queryEmployees(this.employeeForm.value)
      .subscribe((employees) => {
        this.employees = employees;
        this.loading = false;
      });
    this.generatePDF();
  }

  refreshSecon() {
    this.loading = true;
    this.employeeService
      .queryEmployees(this.employeeForm.value)
      .subscribe((employees) => {
        this.employeesSecon = employees;
        this.loading = false;
      });
  }
  data: any[] = [
    { name: 'Alice', age: 25, location: 'New York' },
    { name: 'Bob', age: 30, location: 'Los Angeles' },
    { name: 'Charlie', age: 35, location: 'Chicago' },
  ];
  generatePDF(): void {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Add content to the PDF
    doc.text('Employee Details', 10, 10);

    // Map data array to format it for the PDF
    const mappedData = this.data.map((item, index) => {
      return [
        index + 1, // Serial number
        item.name,
        item.age,
        item.location,
      ];
    });

    // Define columns for the table
    const columns = ['Serial', 'Name', 'Age', 'Location'];

    // Add table to the PDF
    autoTable(doc, {
      startY: 20,
      head: [columns],
      body: mappedData,
    });

    // Save the PDF
    doc.save('employee_details.pdf');
  }
}
