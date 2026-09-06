import { inject, Injectable } from "@angular/core";

import { NgFluxDialogInstance } from "./DialogInstance";
import { NgFluxAlertDialog } from "../components/dialog/boxes/alert/alert.dialog";
import { NgFluxConfirmDialog } from "../components/dialog/boxes/confirm/confirm.dialog";
import { NgFluxPromptDialog } from "../components/dialog/boxes/prompt/prompt.dialog";

import { NgFluxDialogInternal } from "../internal";

import {
  NgFluxComponent,
  NgFluxDialogAlertOptions,
  NgFluxDialogConfig,
  NgFluxDialogConfirmOptions,
  NgFluxDialogEvents,
  NgFluxDialogPromptOptions,
} from "../interfaces";
import { map } from "rxjs";

@Injectable({ providedIn: 'root' })
export class NgFluxDialog {

  private readonly internal = inject(NgFluxDialogInternal);

  open<T = any>(component: NgFluxComponent<any>, config?: NgFluxDialogConfig): NgFluxDialogEvents<T> {
    config ??= {};
    config.backdropClose ??= true;
    config.closeBtn ??= true;
    config.closeOnEsc ??= true;

    const { internal } = this;
    const root = internal.rootRef.instance;

    const onClosed = (ins: NgFluxDialogInstance<T>) => {
      internal.remove(ins);
    };

    const instance = new NgFluxDialogInstance<T>(
      root.viewContainer(),
      component,
      root.injector,
      onClosed,
      config
    );

    internal.add(instance);

    return instance.events;
  }

  readonly closeAll = () => this.internal.closeAll();

  alert(data: NgFluxDialogAlertOptions) {
    const dialog = this.open<boolean>(NgFluxAlertDialog, {
      backdropClose: false,
      closeOnEsc: false,
      data
    });

    return dialog.closed;
  }

  success(data: NgFluxDialogAlertOptions) {
    data.content = `<div class="ngf-dialog-success">${data.content}</div>`;
    return this.alert(data);
  }

  error(data: NgFluxDialogAlertOptions) {
    data.content = `<div class="ngf-dialog-error">${data.content}</div>`;
    return this.alert(data);
  }

  confirm(data: NgFluxDialogConfirmOptions) {
    const dialog = this.open<boolean>(NgFluxConfirmDialog, {
      backdropClose: false,
      closeOnEsc: false,
      data
    });

    return dialog.closed.pipe(
      map(resp => resp ?? false)
    );
  }

  prompt(data: NgFluxDialogPromptOptions) {
    const dialog = this.open(NgFluxPromptDialog, {
      backdropClose: false,
      closeOnEsc: false,
      data
    });

    return dialog.closed;
  }

}
