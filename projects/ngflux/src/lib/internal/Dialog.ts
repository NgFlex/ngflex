import { ApplicationRef, ComponentRef, computed, createComponent, effect, inject, Injectable, signal } from "@angular/core";
import { NgFluxDialogRootComponent } from "../components/dialog/root/root.component";
import { NgFluxDialogInstance } from "../services/DialogInstance";

@Injectable({ providedIn: 'root' })
export class NgFluxDialogInternal {

  private readonly appRef = inject(ApplicationRef);

  private readonly list = signal<NgFluxDialogInstance[]>([]);

  readonly count = computed(() => this.list().length);
  readonly isOpen = computed(() => this.count() > 0);

  readonly active = computed(() => {
    const entries = Array.from(this.list());
    if (!entries.length) return null;

    const lastIndex = entries.length - 1;
    return entries[lastIndex];
  });

  readonly rootRef: ComponentRef<NgFluxDialogRootComponent>;

  constructor() {
    const { appRef } = this;

    this.rootRef = createComponent(NgFluxDialogRootComponent, {
      environmentInjector: appRef.injector,
    });

    const body = document.querySelector('body');

    effect(() => {
      const isOpen = this.isOpen();
      body?.classList.toggle('ngf-dialog-open', isOpen);
    });

    effect(onCleanup => {
      const handler = (e: PopStateEvent) => {
        if (!this.count()) return;
        this.closeAll();
      };

      window.addEventListener('popstate', handler);

      onCleanup(() => {
        window.removeEventListener('popstate', handler);
      });
    });
  }

  initialize() {
    const { appRef, rootRef } = this;
    appRef.attachView(rootRef.hostView);

    const elem = rootRef.location.nativeElement as HTMLElement;
    document.body.appendChild(elem);
  }

  // ==========================

  private readonly indexOf = (item: NgFluxDialogInstance) => {
    const entries = this.list();
    return entries.indexOf(item);
  }

  readonly focus = () => {
    const item = this.active();
    item?.focus();
  }

  readonly add = (...items: NgFluxDialogInstance[]) => this.list.update(v => {
    const list = Array.from(v);

    list.push(...items);

    return list;
  })

  readonly remove = (item: NgFluxDialogInstance) => this.list.update(v => {
    const list = Array.from(v);

    const index = list.indexOf(item);
    list.splice(index, 1);

    return list;
  });

  readonly closeAll = () => {
    const entries = Array.from(this.list());

    while (entries.length) {
      const instance = entries.pop();
      instance?.close(false);
    }

    this.list.set(entries);
  }

  readonly clear = () => {
    this.list.set([]);
  }

}
