-- Tienda Pianura · datos iniciales
-- Lista minorista real de octubre 2026 (precios finales con IVA). Lista mayorista neta tomada de Pianura Gestión.
insert into public.productos (codigo,nombre,familia,unidad,orden,color,imagen,descripcion,precio_mayorista,paso_mayorista,envase_mayorista,precio_kg,precio_medio,precio_cuarto,precio_horma,kg_horma,etiqueta_horma,precio_unidad,stock,publicado) values
('QCR','Queso Cremoso','Quesos blandos','kg',10,'#F2C14E','/img/blandos.jpg','Queso de pasta blanda, suave y cremoso. Ideal para picadas, sándwiches y para fundir.',6800,4,'',11500,5800,2900,42300,4,'Horma entera',null,120,true),
('QPS','Queso Port Salut','Quesos blandos','kg',20,'#E9893A','/img/blandos.jpg','Queso de pasta blanda, suave y cremoso. Ideal para picadas, sándwiches y para fundir.',7310,3.5,'',13500,6800,3400,43400,3.5,'Horma entera',null,94,true),
('QPA','Queso Parrillero','Quesos blandos','kg',30,'#D9A441','/img/blandos.jpg','Queso de pasta blanda, suave y cremoso. Ideal para picadas, sándwiches y para fundir.',7900,3.8,'',23200,11600,5800,81100,3.8,'Horma entera',null,60,true),
('QMZ','Queso Mozzarella','Pasta hilada','kg',40,'#F5E6B8','/img/quesosProd.jpg','Pasta hilada de buen estiramiento, pensada para pizzas y cocina caliente.',6970,4.5,'',13500,6800,3400,55900,4.5,'Horma entera',null,150,true),
('QTY','Queso Tybo','Quesos semiduros','kg',50,'#E8B04A','/img/semiduros.jpg','Queso de pasta semidura y sabor más marcado. Va bien en tablas, sándwiches y en la cocina.',8320,4,'',14900,7400,3700,54800,4,'Horma entera',null,80,true),
('QHO','Queso Holanda','Quesos semiduros','kg',60,'#D96C2C','/img/semiduros.jpg','Queso de pasta semidura y sabor más marcado. Va bien en tablas, sándwiches y en la cocina.',9580,4,'',24000,12000,6000,88300,4,'Horma entera',null,45,true),
('QAZ','Queso Azul','Quesos semiduros','kg',70,'#7E9CC0','/img/semiduros.jpg','Queso de pasta semidura y sabor más marcado. Va bien en tablas, sándwiches y en la cocina.',10840,2,'',23900,12000,6000,44000,2,'Horma entera',null,30,true),
('QSA','Queso Sardo','Quesos duros','kg',80,'#B9853B','/img/duros.jpg','Queso de pasta dura, para rallar o cortar en láminas finas.',11090,3.2,'',26000,13000,6500,76500,3.2,'Horma entera',null,70,true),
('QSP','Queso Sardo pintado','Quesos duros','kg',90,'#9C6B2F','/img/duros.jpg','Queso de pasta dura, para rallar o cortar en láminas finas.',0,3.2,'',26500,13200,6600,null,null,'Horma entera',null,25,true),
('QPE','Queso Pepato','Quesos duros','kg',100,'#8C6A3F','/img/duros.jpg','Queso de pasta dura, para rallar o cortar en láminas finas.',12260,3.6,'',28000,14000,7000,23200,0.9,'¼ horma',null,0,true),
('QRE','Queso Reggianito','Quesos duros','kg',110,'#A8743A','/img/duros.jpg','Queso de pasta dura, para rallar o cortar en láminas finas.',13270,7.5,'',34900,17400,8700,240900,7.5,'Horma entera',null,66,true),
('RIC','Ricotta','Ricotta y crema','kg',120,'#EDE6D6','/img/ricota.jpg','Producto fresco, para cocina dulce y salada.',4370,3,'',7500,3800,1900,20700,3,'Horma entera',null,40,true),
('C20','Crema de leche doble 200 cc','Ricotta y crema','u',130,'#FFF4DC','/img/cremas.jpg','Producto fresco, para cocina dulce y salada.',1450,12,'caja x 12',null,null,null,null,null,'Horma entera',2200,360,true),
('C36','Crema de leche doble 360 cc','Ricotta y crema','u',140,'#F7EFD9','/img/cremas.jpg','Producto fresco, para cocina dulce y salada.',2300,12,'caja x 12',null,null,null,null,null,'Horma entera',3800,300,true),
('C3L','Crema de leche doble 3000 cc','Ricotta y crema','u',150,'#F7EAC8','/img/cremaHome.jpg','Producto fresco, para cocina dulce y salada.',15800,1,'balde',null,null,null,null,null,'Horma entera',32400,30,true),
('C5L','Crema de leche doble 5000 cc','Ricotta y crema','u',160,'#F2E6C4','/img/cremaHome.jpg','Producto fresco, para cocina dulce y salada.',24500,1,'balde',null,null,null,null,null,'Horma entera',52400,20,true),
('D04','Dulce de leche clásico 400 g','Dulce de leche','u',170,'#9B5A2E','/img/dulces.jpg','Dulce de leche clásico, para untar, rellenar y repostería.',2600,12,'caja x 12',null,null,null,null,null,'Horma entera',2600,240,true),
('D1K','Dulce de leche clásico 1 kg','Dulce de leche','u',180,'#7E4521','/img/ddlHome.jpg','Dulce de leche clásico, para untar, rellenar y repostería.',5400,6,'caja x 6',null,null,null,null,null,'Horma entera',7200,120,true)
on conflict (codigo) do nothing;

-- Sardo pintado: solo minorista
-- (precio_mayorista = 0 lo oculta en la lista mayorista)

insert into public.zonas_envio (localidad, costo) values
('Vila',0),('Rafaela',3500),('Sunchales',4500),('Susana',3000),('Lehmann',3000)
on conflict (localidad) do nothing;

insert into public.dias_sin_entrega (fecha, motivo, fecha_alternativa) values
('2026-12-25','Navidad','2026-12-24'),('2027-01-01','Año Nuevo',null)
on conflict (fecha) do nothing;

insert into public.cupones (codigo, porcentaje, envio_gratis, solo, tope_usos, vence) values
('BIENVENIDA10',10,false,'min',200,'2026-12-31')
on conflict (codigo) do nothing;
