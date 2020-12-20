import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ToDoTask } from "src/app/core/models/todo-task";
import { ToDoService } from "./services/to-do.service";

@Component({
  selector: "app-to-do",
  templateUrl: "./to-do.component.html",
  styleUrls: ["./to-do.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToDoComponent implements OnInit, OnDestroy {
  public toDoTasks$: Observable<ToDoTask[]>;
  public toDoForm: FormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private formBuilder: FormBuilder, private toDoService: ToDoService, private cdr: ChangeDetectorRef) {
    this.toDoService.getToDoTaskData();
    this.toDoTasks$ = toDoService.toDoTasks$;
  }

  // todotask formarray property for easy iteration in the DOM
  get toDoTasksFormArray(): FormArray {
    return this.toDoForm.get("toDoTasksArray") as FormArray;
  }

  ngOnInit() {
    const formArray: FormArray = this.formBuilder.array([
      this.formBuilder.group({
        id: ["", Validators.required],
        title: ["", Validators.required],
        date: ["", Validators.required],
        description: "",
      }),
    ]);

    this.toDoForm = this.formBuilder.group({
      toDoTasksArray: formArray,
    });

    this.toDoTasks$.pipe(takeUntil(this.destroy$)).subscribe((toDoTasksObs) => {
      if (toDoTasksObs) {
        this.displayToDoTasks(toDoTasksObs);
      }
    });
  }

  displayToDoTasks(toDoTasks: ToDoTask[]) {
    const toDoTaskFormGroups: any[] = toDoTasks.map((toDoTask) =>
      this.formBuilder.group({
        id: [toDoTask.id, Validators.required],
        title: [toDoTask.title, Validators.required],
        date: [toDoTask.date, Validators.required],
        description: toDoTask.description,
      })
    );
    const toDoTasksFormArray = this.formBuilder.array(toDoTaskFormGroups);
    this.toDoForm.setControl("toDoTasksArray", toDoTasksFormArray);
  }

  addTask() {
    // When adding a task, an id of 0 is assigned, this will allow us to identify
    // that this is a creation and not an edit.
    this.toDoTasksFormArray.push(
      this.formBuilder.group({
        id: [0, Validators.required],
        title: ["", Validators.required],
        date: [new Date(), Validators.required],
        description: "",
      })
    );

    // this automatically scrolls to the new task. It's inside a timeout otherwise
    // it will scroll before rendering.
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  onSave(index: number) {
    if (this.toDoTasksFormArray.at(index).valid) {
      if (this.toDoTasksFormArray.at(index).dirty) {
        const taskControl: FormControl = this.toDoTasksFormArray.at(index) as FormControl;
        const editedTask: ToDoTask = taskControl.value;

        // if id is a 0, this is a creation, else it is an edit
        if (editedTask.id === 0) {
          this.toDoService.createToDoTaskData(editedTask);
        } else {
          this.toDoService.updateToDoTaskData(editedTask.id, editedTask);
        }
        taskControl.markAsPristine();
      }
    }
  }

  onDelete(index: number) {
    const id = this.toDoTasksFormArray.at(index).get("id").value;
    this.toDoTasksFormArray.removeAt(index);

    // Make sure this todotask is not a newly created one.
    if (id !== 0) {
      this.toDoService.deleteToDoTaskData(id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
