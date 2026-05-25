import { Injectable } from "@nestjs/common";

import { ClsService } from "nestjs-cls";
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";

import { BaseEntity } from "../base-entity";

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly clsService: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<BaseEntity>): void {
    const userId = this.clsService.get("userId");

    if (!userId) {
      return;
    }

    event.entity.createdBy = userId;
    event.entity.updatedBy = userId;
  }

  beforeUpdate(event: UpdateEvent<BaseEntity>): void {
    const userId = this.clsService.get("userId");

    if (!event.entity || !userId) {
      return;
    }

    event.entity.updatedBy = userId;
  }
}
