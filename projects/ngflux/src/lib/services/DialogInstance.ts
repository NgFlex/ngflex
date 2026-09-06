import { ComponentRef, Injector, signal, ViewContainerRef } from "@angular/core";
import { AsyncSubject } from "rxjs";

import { NgFluxDialogCommand, NgFluxDialogConfig, NgFluxDialogEvents } from "../interfaces/Dialog";
import { NgFluxDialogComponent } from "../components/dialog/main/main.component";
import { NgFluxDialogRef } from "./DialogRef";
import { NGF_DIALOG_CLOSE_FN, NGF_DIALOG_CONFIG, NGF_DIALOG_CONTENT, NGF_DIALOG_INSTANCE } from "../internal";
import { NgFluxComponent } from "../interfaces";

type OnClosedFn<T = any> = (ins: NgFluxDialogInstance<T>) => void;

export class NgFluxDialogInstance<T = any> {

  private readonly xDialogComponentRef: ComponentRef<NgFluxDialogComponent> = null as any;

  private readonly xClosing = new AsyncSubject<T | null>();
  private readonly xAfterClosed = new AsyncSubject<T | null>();

  readonly events: NgFluxDialogEvents<T> = {
    closing: this.xClosing.asObservable(),
    closed: this.xAfterClosed.asObservable(),
  };

  constructor(
    private readonly viewContainer: ViewContainerRef,
    private readonly component: NgFluxComponent<any>,
    private readonly injector: Injector,
    private readonly onClosed: OnClosedFn<T>,
    readonly config: NgFluxDialogConfig,
  ) {
    const dialogRef = new NgFluxDialogRef<T>(this.onCommand);

    const newInjector = Injector.create({
      parent: injector,
      providers: [
        { provide: NgFluxDialogRef, useValue: dialogRef },
        { provide: NGF_DIALOG_CONFIG, useValue: config },
        { provide: NGF_DIALOG_CONTENT, useValue: component },
        { provide: NGF_DIALOG_CLOSE_FN, useValue: this.afterClosedFn },
        { provide: NgFluxDialogInstance, useValue: this }
      ],
    });

    this.xDialogComponentRef = viewContainer.createComponent(NgFluxDialogComponent, {
      injector: newInjector,
      index: undefined
    });
  }

  private readonly onCommand = (cmd: NgFluxDialogCommand<T>) => {
    const { config } = this;

    switch (cmd.name) {
      case 'esc.close': {
        if (config.closeOnEsc) this.close();
      } break;

      case 'backdrop.close': {
        if (config.backdropClose) this.close();
      } break;

      case 'backButton.close': {
        this.close();
      } break;

      case 'close': {
        this.close(cmd.value);
      } break;
    }
  }

  private readonly afterClosedFn = (data?: T) => {
    const { xDialogComponentRef } = this;
    xDialogComponentRef.destroy();

    this.xAfterClosed.next(data ?? null);
    this.xAfterClosed.complete();

    this.onClosed(this);
  }

  focus() {
    const { xDialogComponentRef: { instance } } = this;
    instance.focus();
  }

  close(data?: T) {
    const { xDialogComponentRef } = this;

    this.xClosing.next(data ?? null);
    this.xClosing.complete();

    xDialogComponentRef.instance.close(data);
  }

  send(cmd: NgFluxDialogCommand<T>) {
    this.onCommand(cmd);
  }

}
