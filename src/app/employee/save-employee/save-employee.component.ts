import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Department } from 'src/app/model/department';
import { Employee } from 'src/app/model/employee';
import { DepartmentService } from 'src/app/service/department.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { Gender } from 'src/app/type/gender';
import { Mode } from 'src/app/type/mode';
import { customName } from 'src/app/validate/custom-name';

@Component({
  selector: 'app-save-employee',
  templateUrl: './save-employee.component.html',
  styleUrls: ['./save-employee.component.scss'],
})
export class SaveEmployeeComponent implements OnInit, OnDestroy {
  departments: Department[] = [];
  Gender = Gender;
  employeeForm: FormGroup = new FormGroup({
    id: new FormControl(),
    firstName: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
    ]),
    lastName: new FormControl(null, Validators.required),
    gender: new FormControl(Gender.MALE),
    department: new FormControl(null, Validators.required),
    version: new FormControl(),
  });
  mode!: Mode;
  Mode = Mode;

  subscribeDepartment!: Subscription;
  subscribeEmployee!: Subscription;
  isLoading!: boolean;
  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private activeRoute: ActivatedRoute,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.departmentService.callApiGetDepartment();

    this.subscribeDepartment = this.departmentService
      .getDepartment()
      .subscribe((response) => {
        this.departments = response;
      });

    this.subscribeEmployee = this.employeeService
      .getEmployee()
      .subscribe((response) => {
        this.employeeForm.patchValue(response);
      });

    this.queryEmployeeById();
  }

  ngOnDestroy(): void {
    this.subscribeDepartment.unsubscribe();
    this.subscribeEmployee.unsubscribe();
  }

  saveEmployee() {
    this.isLoading = true;
    const employee = this.employeeForm.value as Employee;
    if (this.employeeForm.valid) {
      if (Mode.EDIT === this.mode) {
        this.employeeService.editEmployee(employee).subscribe({
          next: (v) => {},
          complete: () => {
            this.isLoading = false;
          },
          error: (e) => {
            this.isLoading = false;
          },
        });
      } else {
        this.employeeService.addEmployee(employee).subscribe({
          next: (v) => {
            this.router.navigateByUrl(`/employee/edit/${v.id}`, {
              replaceUrl: true,
            });
          },
          complete: () => {
            this.mode = Mode.EDIT;
            this.isLoading = false;
          },
          error: (e) => {
            this.isLoading = false;
          },
        });
      }
    } else {
      this.isLoading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please ensure all fields are completed.',
      });
    }
  }

  queryEmployeeById() {
    const { mode } = this.activeRoute.snapshot.data;
    this.mode = mode;
    const { id } = this.activeRoute.snapshot.params;
    if (id && Mode.EDIT === mode) {
      this.employeeService.queryEmployeeById(id);
    }
  }

  resetForm() {
    if (Mode.EDIT === this.mode) {
      this.queryEmployeeById();
    } else {
      this.employeeForm.reset({
        gender: Gender.MALE,
      });
    }
  }

  deleteEmployee() {
    const id = this.employeeForm.get('id')?.value;
    this.employeeService.deleteEmployee(id).subscribe({
      next: (v) => {},
      complete: () => {
        this.router.navigateByUrl('/employee/save', {
          replaceUrl: true,
        });
        this.mode = Mode.ADD;
        this.isLoading = false;
      },
      error: (e) => {
        this.isLoading = false;
      },
    });
  }
}
