CREATE TABLE `payment_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('alipay','wechat') NOT NULL,
	`appId` varchar(128) NOT NULL,
	`privateKey` text NOT NULL,
	`publicKey` text,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_configs_type_unique` UNIQUE(`type`)
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`resourceId` varchar(64) NOT NULL,
	`userId` int,
	`userEmail` varchar(320),
	`amount` int NOT NULL,
	`paymentMethod` enum('alipay','wechat') NOT NULL,
	`status` enum('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(128),
	`paidAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`remark` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `user_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` varchar(64) NOT NULL,
	`paymentOrderId` int NOT NULL,
	`price` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_purchases_id` PRIMARY KEY(`id`)
);
