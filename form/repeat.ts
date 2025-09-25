import { Component } from '@angular/core';
import { FieldArrayType } from '@ngx-formly/core';

@Component({
selector: 'formly-repeat-section',
template: `
<div class="mb-3">
<legend *ngIf="props.label">{{ props.label }}</legend>
<p *ngIf="props.description">{{ props.description }}</p>

<div *ngFor="let field of field.fieldGroup; let i = index" class="row align-items-baseline">
<formly-field class="col" [field]="field"></formly-field>
<div class="col-1 d-flex align-items-center">
<button class="btn btn-danger" type="button" (click)="remove(i)">-</button>
</div>
</div>
<div style="margin:30px 0;">
<button class="btn btn-primary" type="button" (click)="add()">{{ props.addText }}</button>
</div>
</div>
`,
})
export class RepeatTypeComponent extends FieldArrayType {}


form = new FormGroup({});
  model: any = {
    tasks: [null],
  };
  options: FormlyFormOptions = {};

  fields: FormlyFieldConfig[] = [
    {
      key: 'tasks',
      type: 'repeat',
      props: {
        addText: 'Add Task',
        label: 'TODO LIST',
      },
      fieldArray: {
        type: 'input',
        props: {
          placeholder: 'Task name',
          required: true,
        },
      },
    },
  ];

  <form [formGroup]="form" (ngSubmit)="submit()">
  <formly-form [model]="model" [fields]="fields" [options]="options" [form]="form"></formly-form>
  <button type="submit" class="btn btn-primary submit-button" [disabled]="!form.valid">Submit</button>
</form>

   FormlyModule.forRoot({
      types: [{ name: 'repeat', component: RepeatTypeComponent }],
      validationMessages: [{ name: 'required', message: 'This field is required' }],
    }),