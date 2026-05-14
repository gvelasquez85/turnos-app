-- ============================================================================
-- PUC (Plan Único de Cuentas) - Seed function
-- Called when a brand activates the accounting module to populate their chart
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_puc_for_brand(p_brand_id UUID)
RETURNS void AS $$
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM public.accounts WHERE brand_id = p_brand_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.accounts (brand_id, code, parent_code, name, class, nature, level, is_system, allows_movement) VALUES
  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 1: ACTIVOS (naturaleza débito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '1', NULL, 'Activos', 1, 'debit', 1, true, false),
    -- Grupo 11: Disponible
    (p_brand_id, '11', '1', 'Disponible', 1, 'debit', 2, true, false),
      (p_brand_id, '1105', '11', 'Caja', 1, 'debit', 3, true, false),
        (p_brand_id, '110505', '1105', 'Caja general', 1, 'debit', 4, true, true),
        (p_brand_id, '110510', '1105', 'Cajas menores', 1, 'debit', 4, true, true),
      (p_brand_id, '1110', '11', 'Bancos', 1, 'debit', 3, true, false),
        (p_brand_id, '111005', '1110', 'Cuentas corrientes', 1, 'debit', 4, true, true),
        (p_brand_id, '111010', '1110', 'Cuentas de ahorro', 1, 'debit', 4, true, true),
      (p_brand_id, '1120', '11', 'Cuentas de ahorro', 1, 'debit', 3, true, true),

    -- Grupo 12: Inversiones
    (p_brand_id, '12', '1', 'Inversiones', 1, 'debit', 2, true, false),
      (p_brand_id, '1205', '12', 'Acciones', 1, 'debit', 3, true, true),
      (p_brand_id, '1225', '12', 'Certificados', 1, 'debit', 3, true, true),

    -- Grupo 13: Deudores
    (p_brand_id, '13', '1', 'Deudores', 1, 'debit', 2, true, false),
      (p_brand_id, '1305', '13', 'Clientes', 1, 'debit', 3, true, false),
        (p_brand_id, '130505', '1305', 'Clientes nacionales', 1, 'debit', 4, true, true),
      (p_brand_id, '1310', '13', 'Cuentas corrientes comerciales', 1, 'debit', 3, true, true),
      (p_brand_id, '1325', '13', 'Cuentas por cobrar a socios', 1, 'debit', 3, true, true),
      (p_brand_id, '1330', '13', 'Anticipos y avances', 1, 'debit', 3, true, true),
      (p_brand_id, '1345', '13', 'Ingresos por cobrar', 1, 'debit', 3, true, true),
      (p_brand_id, '1355', '13', 'Anticipo de impuestos', 1, 'debit', 3, true, false),
        (p_brand_id, '135505', '1355', 'Anticipo de renta', 1, 'debit', 4, true, true),
        (p_brand_id, '135510', '1355', 'Retención en la fuente', 1, 'debit', 4, true, true),
        (p_brand_id, '135515', '1355', 'Retención de IVA', 1, 'debit', 4, true, true),
        (p_brand_id, '135517', '1355', 'Retención de ICA', 1, 'debit', 4, true, true),
      (p_brand_id, '1365', '13', 'Cuentas por cobrar trabajadores', 1, 'debit', 3, true, true),
      (p_brand_id, '1380', '13', 'Deudores varios', 1, 'debit', 3, true, true),
      (p_brand_id, '1399', '13', 'Provisiones (CR)', 1, 'credit', 3, true, true),

    -- Grupo 14: Inventarios
    (p_brand_id, '14', '1', 'Inventarios', 1, 'debit', 2, true, false),
      (p_brand_id, '1405', '14', 'Materias primas', 1, 'debit', 3, true, true),
      (p_brand_id, '1410', '14', 'Productos en proceso', 1, 'debit', 3, true, true),
      (p_brand_id, '1430', '14', 'Productos terminados', 1, 'debit', 3, true, true),
      (p_brand_id, '1435', '14', 'Mercancías no fabricadas por la empresa', 1, 'debit', 3, true, true),
      (p_brand_id, '1455', '14', 'Materiales, repuestos y accesorios', 1, 'debit', 3, true, true),
      (p_brand_id, '1499', '14', 'Provisiones (CR)', 1, 'credit', 3, true, true),

    -- Grupo 15: Propiedades, planta y equipo
    (p_brand_id, '15', '1', 'Propiedades, planta y equipo', 1, 'debit', 2, true, false),
      (p_brand_id, '1504', '15', 'Terrenos', 1, 'debit', 3, true, true),
      (p_brand_id, '1516', '15', 'Construcciones y edificaciones', 1, 'debit', 3, true, true),
      (p_brand_id, '1520', '15', 'Maquinaria y equipo', 1, 'debit', 3, true, true),
      (p_brand_id, '1524', '15', 'Equipo de oficina', 1, 'debit', 3, true, true),
      (p_brand_id, '1528', '15', 'Equipo de computación', 1, 'debit', 3, true, true),
      (p_brand_id, '1540', '15', 'Flota y equipo de transporte', 1, 'debit', 3, true, true),
      (p_brand_id, '1592', '15', 'Depreciación acumulada (CR)', 1, 'credit', 3, true, true),

    -- Grupo 16: Intangibles
    (p_brand_id, '16', '1', 'Intangibles', 1, 'debit', 2, true, false),
      (p_brand_id, '1605', '16', 'Crédito mercantil', 1, 'debit', 3, true, true),
      (p_brand_id, '1610', '16', 'Marcas', 1, 'debit', 3, true, true),
      (p_brand_id, '1615', '16', 'Patentes', 1, 'debit', 3, true, true),
      (p_brand_id, '1620', '16', 'Know-how', 1, 'debit', 3, true, true),
      (p_brand_id, '1625', '16', 'Licencias', 1, 'debit', 3, true, true),
      (p_brand_id, '1698', '16', 'Amortización acumulada (CR)', 1, 'credit', 3, true, true),

    -- Grupo 17: Diferidos
    (p_brand_id, '17', '1', 'Diferidos', 1, 'debit', 2, true, false),
      (p_brand_id, '1705', '17', 'Gastos pagados por anticipado', 1, 'debit', 3, true, true),
      (p_brand_id, '1710', '17', 'Cargos diferidos', 1, 'debit', 3, true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 2: PASIVOS (naturaleza crédito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '2', NULL, 'Pasivos', 2, 'credit', 1, true, false),
    -- Grupo 21: Obligaciones financieras
    (p_brand_id, '21', '2', 'Obligaciones financieras', 2, 'credit', 2, true, false),
      (p_brand_id, '2105', '21', 'Bancos nacionales', 2, 'credit', 3, true, true),
      (p_brand_id, '2120', '21', 'Compañías de financiamiento', 2, 'credit', 3, true, true),

    -- Grupo 22: Proveedores
    (p_brand_id, '22', '2', 'Proveedores', 2, 'credit', 2, true, false),
      (p_brand_id, '2205', '22', 'Proveedores nacionales', 2, 'credit', 3, true, true),
      (p_brand_id, '2210', '22', 'Proveedores del exterior', 2, 'credit', 3, true, true),

    -- Grupo 23: Cuentas por pagar
    (p_brand_id, '23', '2', 'Cuentas por pagar', 2, 'credit', 2, true, false),
      (p_brand_id, '2305', '23', 'Cuentas corrientes comerciales', 2, 'credit', 3, true, true),
      (p_brand_id, '2335', '23', 'Costos y gastos por pagar', 2, 'credit', 3, true, true),
      (p_brand_id, '2355', '23', 'Deudas con socios', 2, 'credit', 3, true, true),
      (p_brand_id, '2360', '23', 'Dividendos por pagar', 2, 'credit', 3, true, true),
      (p_brand_id, '2365', '23', 'Retención en la fuente', 2, 'credit', 3, true, false),
        (p_brand_id, '236505', '2365', 'Retención salarios', 2, 'credit', 4, true, true),
        (p_brand_id, '236510', '2365', 'Retención honorarios', 2, 'credit', 4, true, true),
        (p_brand_id, '236515', '2365', 'Retención servicios', 2, 'credit', 4, true, true),
        (p_brand_id, '236520', '2365', 'Retención compras', 2, 'credit', 4, true, true),
        (p_brand_id, '236525', '2365', 'Retención arrendamientos', 2, 'credit', 4, true, true),
      (p_brand_id, '2367', '23', 'Retención de ICA', 2, 'credit', 3, true, true),
      (p_brand_id, '2368', '23', 'Retención de IVA', 2, 'credit', 3, true, true),
      (p_brand_id, '2370', '23', 'Retenciones y aportes de nómina', 2, 'credit', 3, true, true),
      (p_brand_id, '2380', '23', 'Acreedores varios', 2, 'credit', 3, true, true),

    -- Grupo 24: Impuestos por pagar
    (p_brand_id, '24', '2', 'Impuestos, gravámenes y tasas', 2, 'credit', 2, true, false),
      (p_brand_id, '2404', '24', 'Renta y complementarios', 2, 'credit', 3, true, true),
      (p_brand_id, '2408', '24', 'IVA', 2, 'credit', 3, true, false),
        (p_brand_id, '240801', '2408', 'IVA generado 19%', 2, 'credit', 4, true, true),
        (p_brand_id, '240802', '2408', 'IVA generado 5%', 2, 'credit', 4, true, true),
        (p_brand_id, '240803', '2408', 'IVA descontable', 2, 'debit', 4, true, true),
      (p_brand_id, '2412', '24', 'Industria y comercio (ICA)', 2, 'credit', 3, true, true),
      (p_brand_id, '2416', '24', 'Impuesto al consumo (INC)', 2, 'credit', 3, true, true),

    -- Grupo 25: Obligaciones laborales
    (p_brand_id, '25', '2', 'Obligaciones laborales', 2, 'credit', 2, true, false),
      (p_brand_id, '2505', '25', 'Salarios por pagar', 2, 'credit', 3, true, true),
      (p_brand_id, '2510', '25', 'Cesantías consolidadas', 2, 'credit', 3, true, true),
      (p_brand_id, '2515', '25', 'Intereses sobre cesantías', 2, 'credit', 3, true, true),
      (p_brand_id, '2520', '25', 'Prima de servicios', 2, 'credit', 3, true, true),
      (p_brand_id, '2525', '25', 'Vacaciones consolidadas', 2, 'credit', 3, true, true),

    -- Grupo 26: Pasivos estimados
    (p_brand_id, '26', '2', 'Pasivos estimados y provisiones', 2, 'credit', 2, true, false),
      (p_brand_id, '2610', '26', 'Obligaciones fiscales', 2, 'credit', 3, true, true),
      (p_brand_id, '2615', '26', 'Obligaciones laborales', 2, 'credit', 3, true, true),

    -- Grupo 28: Otros pasivos
    (p_brand_id, '28', '2', 'Otros pasivos', 2, 'credit', 2, true, false),
      (p_brand_id, '2805', '28', 'Anticipos y avances recibidos', 2, 'credit', 3, true, true),
      (p_brand_id, '2815', '28', 'Ingresos recibidos para terceros', 2, 'credit', 3, true, true),
      (p_brand_id, '2895', '28', 'Diversos', 2, 'credit', 3, true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 3: PATRIMONIO (naturaleza crédito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '3', NULL, 'Patrimonio', 3, 'credit', 1, true, false),
    (p_brand_id, '31', '3', 'Capital social', 3, 'credit', 2, true, false),
      (p_brand_id, '3105', '31', 'Capital suscrito y pagado', 3, 'credit', 3, true, true),
      (p_brand_id, '3115', '31', 'Aportes sociales', 3, 'credit', 3, true, true),
    (p_brand_id, '32', '3', 'Superávit de capital', 3, 'credit', 2, true, false),
      (p_brand_id, '3205', '32', 'Prima en colocación de acciones', 3, 'credit', 3, true, true),
    (p_brand_id, '33', '3', 'Reservas', 3, 'credit', 2, true, false),
      (p_brand_id, '3305', '33', 'Reserva legal', 3, 'credit', 3, true, true),
      (p_brand_id, '3310', '33', 'Reservas estatutarias', 3, 'credit', 3, true, true),
    (p_brand_id, '36', '3', 'Resultados del ejercicio', 3, 'credit', 2, true, false),
      (p_brand_id, '3605', '36', 'Utilidad del ejercicio', 3, 'credit', 3, true, true),
      (p_brand_id, '3610', '36', 'Pérdida del ejercicio', 3, 'debit', 3, true, true),
    (p_brand_id, '37', '3', 'Resultados de ejercicios anteriores', 3, 'credit', 2, true, false),
      (p_brand_id, '3705', '37', 'Utilidades acumuladas', 3, 'credit', 3, true, true),
      (p_brand_id, '3710', '37', 'Pérdidas acumuladas', 3, 'debit', 3, true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 4: INGRESOS (naturaleza crédito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '4', NULL, 'Ingresos', 4, 'credit', 1, true, false),
    (p_brand_id, '41', '4', 'Operacionales', 4, 'credit', 2, true, false),
      (p_brand_id, '4105', '41', 'Agricultura, ganadería, caza y silvicultura', 4, 'credit', 3, true, true),
      (p_brand_id, '4110', '41', 'Pesca', 4, 'credit', 3, true, true),
      (p_brand_id, '4115', '41', 'Explotación de minas y canteras', 4, 'credit', 3, true, true),
      (p_brand_id, '4120', '41', 'Industrias manufactureras', 4, 'credit', 3, true, true),
      (p_brand_id, '4130', '41', 'Construcción', 4, 'credit', 3, true, true),
      (p_brand_id, '4135', '41', 'Comercio al por mayor y al por menor', 4, 'credit', 3, true, true),
      (p_brand_id, '4140', '41', 'Hoteles y restaurantes', 4, 'credit', 3, true, true),
      (p_brand_id, '4145', '41', 'Transporte, almacenamiento y comunicaciones', 4, 'credit', 3, true, true),
      (p_brand_id, '4155', '41', 'Actividades inmobiliarias', 4, 'credit', 3, true, true),
      (p_brand_id, '4160', '41', 'Enseñanza', 4, 'credit', 3, true, true),
      (p_brand_id, '4165', '41', 'Servicios sociales y de salud', 4, 'credit', 3, true, true),
      (p_brand_id, '4170', '41', 'Otras actividades de servicios', 4, 'credit', 3, true, true),
      (p_brand_id, '4175', '41', 'Devoluciones, rebajas y descuentos (DB)', 4, 'debit', 3, true, true),
    (p_brand_id, '42', '4', 'No operacionales', 4, 'credit', 2, true, false),
      (p_brand_id, '4210', '42', 'Financieros', 4, 'credit', 3, true, true),
      (p_brand_id, '4215', '42', 'Dividendos y participaciones', 4, 'credit', 3, true, true),
      (p_brand_id, '4220', '42', 'Arrendamientos', 4, 'credit', 3, true, true),
      (p_brand_id, '4245', '42', 'Utilidad en venta de propiedades', 4, 'credit', 3, true, true),
      (p_brand_id, '4250', '42', 'Recuperaciones', 4, 'credit', 3, true, true),
      (p_brand_id, '4295', '42', 'Diversos', 4, 'credit', 3, true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 5: GASTOS (naturaleza débito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '5', NULL, 'Gastos', 5, 'debit', 1, true, false),
    (p_brand_id, '51', '5', 'Operacionales de administración', 5, 'debit', 2, true, false),
      (p_brand_id, '5105', '51', 'Gastos de personal', 5, 'debit', 3, true, false),
        (p_brand_id, '510506', '5105', 'Sueldos', 5, 'debit', 4, true, true),
        (p_brand_id, '510515', '5105', 'Horas extras', 5, 'debit', 4, true, true),
        (p_brand_id, '510518', '5105', 'Comisiones', 5, 'debit', 4, true, true),
        (p_brand_id, '510524', '5105', 'Incapacidades', 5, 'debit', 4, true, true),
        (p_brand_id, '510527', '5105', 'Auxilio de transporte', 5, 'debit', 4, true, true),
        (p_brand_id, '510530', '5105', 'Cesantías', 5, 'debit', 4, true, true),
        (p_brand_id, '510533', '5105', 'Intereses sobre cesantías', 5, 'debit', 4, true, true),
        (p_brand_id, '510536', '5105', 'Prima de servicios', 5, 'debit', 4, true, true),
        (p_brand_id, '510539', '5105', 'Vacaciones', 5, 'debit', 4, true, true),
        (p_brand_id, '510568', '5105', 'Aportes a EPS', 5, 'debit', 4, true, true),
        (p_brand_id, '510569', '5105', 'Aportes a fondos de pensiones', 5, 'debit', 4, true, true),
        (p_brand_id, '510570', '5105', 'Aportes a ARL', 5, 'debit', 4, true, true),
        (p_brand_id, '510572', '5105', 'Aportes caja de compensación', 5, 'debit', 4, true, true),
        (p_brand_id, '510575', '5105', 'Aportes ICBF', 5, 'debit', 4, true, true),
        (p_brand_id, '510578', '5105', 'Aportes SENA', 5, 'debit', 4, true, true),
      (p_brand_id, '5110', '51', 'Honorarios', 5, 'debit', 3, true, true),
      (p_brand_id, '5115', '51', 'Impuestos', 5, 'debit', 3, true, true),
      (p_brand_id, '5120', '51', 'Arrendamientos', 5, 'debit', 3, true, true),
      (p_brand_id, '5125', '51', 'Contribuciones y afiliaciones', 5, 'debit', 3, true, true),
      (p_brand_id, '5130', '51', 'Seguros', 5, 'debit', 3, true, true),
      (p_brand_id, '5135', '51', 'Servicios', 5, 'debit', 3, true, false),
        (p_brand_id, '513505', '5135', 'Aseo y vigilancia', 5, 'debit', 4, true, true),
        (p_brand_id, '513510', '5135', 'Temporales', 5, 'debit', 4, true, true),
        (p_brand_id, '513525', '5135', 'Acueducto y alcantarillado', 5, 'debit', 4, true, true),
        (p_brand_id, '513530', '5135', 'Energía eléctrica', 5, 'debit', 4, true, true),
        (p_brand_id, '513535', '5135', 'Teléfono', 5, 'debit', 4, true, true),
        (p_brand_id, '513540', '5135', 'Correo, portes y telegramas', 5, 'debit', 4, true, true),
        (p_brand_id, '513545', '5135', 'Internet', 5, 'debit', 4, true, true),
        (p_brand_id, '513550', '5135', 'Transporte, fletes y acarreos', 5, 'debit', 4, true, true),
        (p_brand_id, '513595', '5135', 'Otros servicios', 5, 'debit', 4, true, true),
      (p_brand_id, '5140', '51', 'Gastos legales', 5, 'debit', 3, true, true),
      (p_brand_id, '5145', '51', 'Mantenimiento y reparaciones', 5, 'debit', 3, true, true),
      (p_brand_id, '5150', '51', 'Adecuación e instalación', 5, 'debit', 3, true, true),
      (p_brand_id, '5155', '51', 'Gastos de viaje', 5, 'debit', 3, true, true),
      (p_brand_id, '5160', '51', 'Depreciaciones', 5, 'debit', 3, true, true),
      (p_brand_id, '5165', '51', 'Amortizaciones', 5, 'debit', 3, true, true),
      (p_brand_id, '5195', '51', 'Diversos', 5, 'debit', 3, true, true),
      (p_brand_id, '5199', '51', 'Provisiones', 5, 'debit', 3, true, true),

    (p_brand_id, '52', '5', 'Operacionales de ventas', 5, 'debit', 2, true, false),
      (p_brand_id, '5205', '52', 'Gastos de personal', 5, 'debit', 3, true, true),
      (p_brand_id, '5210', '52', 'Honorarios', 5, 'debit', 3, true, true),
      (p_brand_id, '5215', '52', 'Impuestos', 5, 'debit', 3, true, true),
      (p_brand_id, '5220', '52', 'Arrendamientos', 5, 'debit', 3, true, true),
      (p_brand_id, '5235', '52', 'Servicios', 5, 'debit', 3, true, true),
      (p_brand_id, '5240', '52', 'Gastos legales', 5, 'debit', 3, true, true),
      (p_brand_id, '5245', '52', 'Mantenimiento y reparaciones', 5, 'debit', 3, true, true),
      (p_brand_id, '5250', '52', 'Adecuación e instalación', 5, 'debit', 3, true, true),
      (p_brand_id, '5255', '52', 'Gastos de viaje', 5, 'debit', 3, true, true),
      (p_brand_id, '5295', '52', 'Diversos', 5, 'debit', 3, true, true),

    (p_brand_id, '53', '5', 'No operacionales', 5, 'debit', 2, true, false),
      (p_brand_id, '5305', '53', 'Financieros', 5, 'debit', 3, true, false),
        (p_brand_id, '530505', '5305', 'Gastos bancarios', 5, 'debit', 4, true, true),
        (p_brand_id, '530510', '5305', 'Comisiones bancarias', 5, 'debit', 4, true, true),
        (p_brand_id, '530515', '5305', 'Intereses', 5, 'debit', 4, true, true),
        (p_brand_id, '530520', '5305', 'GMF (4x1000)', 5, 'debit', 4, true, true),
      (p_brand_id, '5310', '53', 'Pérdida en venta de activos', 5, 'debit', 3, true, true),
      (p_brand_id, '5315', '53', 'Gastos extraordinarios', 5, 'debit', 3, true, true),
      (p_brand_id, '5395', '53', 'Gastos diversos', 5, 'debit', 3, true, true),

    (p_brand_id, '54', '5', 'Impuesto de renta', 5, 'debit', 2, true, false),
      (p_brand_id, '5405', '54', 'Impuesto de renta y complementarios', 5, 'debit', 3, true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CLASE 6: COSTOS DE VENTAS (naturaleza débito)
  -- ═══════════════════════════════════════════════════════════════════════════
  (p_brand_id, '6', NULL, 'Costos de ventas', 6, 'debit', 1, true, false),
    (p_brand_id, '61', '6', 'Costo de ventas y de prestación de servicios', 6, 'debit', 2, true, false),
      (p_brand_id, '6105', '61', 'Agricultura, ganadería, caza y silvicultura', 6, 'debit', 3, true, true),
      (p_brand_id, '6120', '61', 'Industrias manufactureras', 6, 'debit', 3, true, true),
      (p_brand_id, '6135', '61', 'Comercio al por mayor y al por menor', 6, 'debit', 3, true, true),
      (p_brand_id, '6140', '61', 'Hoteles y restaurantes', 6, 'debit', 3, true, true),
      (p_brand_id, '6145', '61', 'Transporte, almacenamiento y comunicaciones', 6, 'debit', 3, true, true),
      (p_brand_id, '6155', '61', 'Actividades inmobiliarias', 6, 'debit', 3, true, true),
      (p_brand_id, '6160', '61', 'Enseñanza', 6, 'debit', 3, true, true),
      (p_brand_id, '6165', '61', 'Servicios sociales y de salud', 6, 'debit', 3, true, true),
      (p_brand_id, '6170', '61', 'Otras actividades de servicios', 6, 'debit', 3, true, true)
  ;
END;
$$ LANGUAGE plpgsql;
