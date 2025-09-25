// repeat-section.type.ts
import { Component } from '@angular/core';
import { FieldArrayType } from '@ngx-formly/core';

@Component({
  selector: 'formly-repeat-section',
  template: `
    <div *ngFor="let f of field.fieldGroup; let i = index" class="mb-3">
      <formly-field [field]="f"></formly-field>
      <div class="mt-1 flex gap-2">
        <button type="button" (click)="remove(i)">Remove</button>
        <button type="button" (click)="move(i, -1)" [disabled]="i===0">↑</button>
        <button type="button" (click)="move(i, +1)" [disabled]="i===field.fieldGroup.length-1">↓</button>
      </div>
    </div>
    <button type="button" (click)="add()">+ Add</button>
  `,
})
export class RepeatSectionTypeComponent extends FieldArrayType {
  move(i: number, dir: 1 | -1) {
    const arr = this.field.model as any[];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.modelChange.emit(this.field.model);
  }
}