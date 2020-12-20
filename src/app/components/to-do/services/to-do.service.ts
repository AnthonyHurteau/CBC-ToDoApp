import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { ToDoTask } from "src/app/core/models/todo-task";
import { environment } from "../../../../environments/environment";
import { catchError, retry, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class ToDoService {
  private apiUrl = environment.apiUrl;
  private controllerUrl = "todotask";
  private url = this.apiUrl + this.controllerUrl;
  private headers: HttpHeaders;
  private retries = 3;
  private _toDoTasks: BehaviorSubject<ToDoTask[]> = new BehaviorSubject<ToDoTask[]>(null);
  readonly toDoTasks$: Observable<ToDoTask[]> = this._toDoTasks.asObservable();

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders({ "Content-Type": "application/json" });
  }

  private get toDoTasks(): ToDoTask[] {
    return this._toDoTasks.getValue();
  }
  private set toDoTasks(val: ToDoTask[]) {
    this._toDoTasks.next(val);
  }

  public getToDoTaskData() {
    this.getToDoTask().subscribe((toDoTasksObs) => {
      this.toDoTasks = toDoTasksObs;
      this.sortToDos();
    });
  }

  public createToDoTaskData(toDoTask: ToDoTask) {
    this.postToDoTask(toDoTask).subscribe({
      next: (toDoTaskObs) => {
        if (toDoTaskObs) {
          // This snippet grabs the "real" todotask coming back form the server and inserts it in the cached data
          // This way, the UI is quickly updated with the new data without having to do another get call
          this.toDoTasks.push(toDoTask);
          this.sortToDos();
        }
      },
      error: (error: any) => {
        // due to having limited time, I will not implement an error message service.
        // Instead, this will simply force a  reset the todotask list with the original values. Which means that the form controls
        // will be automatically reset since the they are subsribed to the todotask observable here in this service.
        this.toDoTasks = this.toDoTasks;
        this.sortToDos();
      },
    });
  }

  public updateToDoTaskData(id: number, toDoTask: ToDoTask) {
    this.putToDoTask(id, toDoTask).subscribe({
      next: (toDoTaskObs) => {
        if (toDoTaskObs) {
          // This snippet grabs the "real" todotask coming back form the server and inserts it in the cached data
          // This way, the UI is quickly updated with the new data without having to do another get call
          const index: number = this.toDoTasks.findIndex((t) => t.id === id);
          this.toDoTasks.splice(index, 1, toDoTaskObs);
          this.sortToDos();
        }
      },
      error: (error: any) => {
        // due to having limited time, I will not implement an error message service.
        // Instead, this will simply force a  reset the todotask list with the original values. Which means that the form controls
        // will be automatically reset since the they are subsribed to the todotask observable here in this service.
        this.toDoTasks = this.toDoTasks;
        this.sortToDos();
      },
    });
  }

  public deleteToDoTaskData(id: number) {
    this.deleteToDoTask(id).subscribe({
      next: null,
      error: (error: any) => {
        // due to having limited time, I will not implement an error message service.
        // Instead, this will simply force a  reset the todotask list with the original values. Which means that the form controls
        // will be automatically reset since the they are subsribed to the todotask observable here in this service.
        this.toDoTasks = this.toDoTasks;
        this.sortToDos();
      },
      complete: () => {
        // This snippet grabs the "real" todotask coming back form the server and inserts it in the cached data
        // This way, the UI is quickly updated with the new data without having to do another get call
        const index: number = this.toDoTasks.findIndex((t) => t.id === id);
        this.toDoTasks.splice(index, 1);
        this.sortToDos();
      },
    });
  }

  private getToDoTask(): Observable<ToDoTask[]> {
    return this.http
      .get<ToDoTask[]>(this.url, { headers: this.headers })
      .pipe(
        retry(this.retries),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  private postToDoTask(toDoTask: ToDoTask): Observable<ToDoTask> {
    return this.http
      .post<ToDoTask>(this.url, toDoTask, { headers: this.headers })
      .pipe(
        retry(this.retries),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  private putToDoTask(id: number, toDoTask: ToDoTask): Observable<ToDoTask> {
    const url = `${this.url}/${id}`;
    return this.http
      .put<ToDoTask>(url, toDoTask, { headers: this.headers })
      .pipe(
        retry(this.retries),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  private deleteToDoTask(id: number): Observable<ToDoTask> {
    const url = `${this.url}/${id}`;
    return this.http
      .delete<ToDoTask>(url, { headers: this.headers })
      .pipe(
        retry(this.retries),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  private sortToDos() {
    this.toDoTasks = this.toDoTasks.sort((a, b) => {
      return new Date(a.date) < new Date(b.date) ? -1 : 1;
    });
  }
}
