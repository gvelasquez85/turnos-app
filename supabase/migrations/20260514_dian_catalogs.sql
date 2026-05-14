-- ============================================================================
-- DIAN Reference Catalogs (shared, not brand-specific)
-- ============================================================================

-- Departments (DANE codes)
CREATE TABLE IF NOT EXISTS public.dian_departments (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Municipalities (DANE codes)
CREATE TABLE IF NOT EXISTS public.dian_municipalities (
  code TEXT PRIMARY KEY,
  department_code TEXT NOT NULL REFERENCES public.dian_departments(code),
  name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dian_municipalities_dept ON public.dian_municipalities(department_code);

-- Document types (CC, NIT, CE, TI, etc.)
CREATE TABLE IF NOT EXISTS public.dian_document_types (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Tax responsibilities
CREATE TABLE IF NOT EXISTS public.dian_tax_responsibilities (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Payment methods (forma de pago: contado/crédito)
CREATE TABLE IF NOT EXISTS public.dian_payment_methods (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Payment means (medio de pago: efectivo, tarjeta, transferencia, etc.)
CREATE TABLE IF NOT EXISTS public.dian_payment_means (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Units of measure (UN/ECE codes)
CREATE TABLE IF NOT EXISTS public.dian_units_of_measure (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Tax types
CREATE TABLE IF NOT EXISTS public.dian_tax_types (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  default_rate NUMERIC(5,2)
);

-- ============================================================================
-- SEED: Document Types
-- ============================================================================
INSERT INTO public.dian_document_types (code, description) VALUES
  ('11', 'Registro civil'),
  ('12', 'Tarjeta de identidad'),
  ('13', 'Cédula de ciudadanía'),
  ('21', 'Tarjeta de extranjería'),
  ('22', 'Cédula de extranjería'),
  ('31', 'NIT'),
  ('41', 'Pasaporte'),
  ('42', 'Documento de identificación extranjero'),
  ('47', 'PEP (Permiso Especial de Permanencia)'),
  ('50', 'NIT de otro país'),
  ('91', 'NUIP')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Tax Responsibilities
-- ============================================================================
INSERT INTO public.dian_tax_responsibilities (code, description) VALUES
  ('O-13', 'Gran contribuyente'),
  ('O-15', 'Autorretenedor'),
  ('O-23', 'Agente de retención IVA'),
  ('O-47', 'Régimen simple de tributación'),
  ('O-48', 'Responsable de IVA'),
  ('O-49', 'No responsable de IVA'),
  ('R-99-PN', 'No responsable - Persona Natural')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Payment Methods (Forma de pago)
-- ============================================================================
INSERT INTO public.dian_payment_methods (code, description) VALUES
  ('1', 'Contado'),
  ('2', 'Crédito')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Payment Means (Medio de pago)
-- ============================================================================
INSERT INTO public.dian_payment_means (code, description) VALUES
  ('10', 'Efectivo'),
  ('20', 'Cheque'),
  ('30', 'Transferencia débito bancaria'),
  ('31', 'Transferencia débito cámara'),
  ('32', 'Transferencia débito regulada'),
  ('42', 'Consignación bancaria'),
  ('47', 'Transferencia electrónica'),
  ('48', 'Tarjeta de crédito'),
  ('49', 'Tarjeta de débito'),
  ('71', 'Bonos'),
  ('72', 'Vales'),
  ('ZZZ', 'Otro')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Units of Measure (UN/ECE Rec 20)
-- ============================================================================
INSERT INTO public.dian_units_of_measure (code, description) VALUES
  ('NAR', 'Unidad'),
  ('EA', 'Cada uno'),
  ('KGM', 'Kilogramo'),
  ('GRM', 'Gramo'),
  ('LTR', 'Litro'),
  ('MTR', 'Metro'),
  ('MTK', 'Metro cuadrado'),
  ('MTQ', 'Metro cúbico'),
  ('HUR', 'Hora'),
  ('DAY', 'Día'),
  ('MON', 'Mes'),
  ('ANN', 'Año'),
  ('SET', 'Conjunto'),
  ('PR', 'Par'),
  ('DZN', 'Docena'),
  ('BX', 'Caja'),
  ('PK', 'Paquete'),
  ('BG', 'Bolsa'),
  ('BO', 'Botella'),
  ('TNE', 'Tonelada'),
  ('CMT', 'Centímetro'),
  ('MMT', 'Milímetro'),
  ('MLT', 'Mililitro'),
  ('XUN', 'Unidad (servicio)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Tax Types
-- ============================================================================
INSERT INTO public.dian_tax_types (code, description, default_rate) VALUES
  ('01', 'IVA', 19.00),
  ('02', 'Impuesto al consumo (IC)', 8.00),
  ('03', 'ICA', NULL),
  ('04', 'INC (Impuesto Nacional al Consumo)', 8.00),
  ('05', 'ReteIVA', NULL),
  ('06', 'Retención en la fuente', NULL),
  ('07', 'ReteICA', NULL),
  ('20', 'FtoHorticultura', NULL),
  ('21', 'Timbre', NULL),
  ('22', 'INC Bolsas', NULL),
  ('23', 'INC Bebidas azucaradas', NULL),
  ('24', 'INC Alimentos ultraprocesados', NULL),
  ('ZZ', 'Otro tributo', NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Departments (Colombia - DANE)
-- ============================================================================
INSERT INTO public.dian_departments (code, name) VALUES
  ('05', 'Antioquia'),
  ('08', 'Atlántico'),
  ('11', 'Bogotá D.C.'),
  ('13', 'Bolívar'),
  ('15', 'Boyacá'),
  ('17', 'Caldas'),
  ('18', 'Caquetá'),
  ('19', 'Cauca'),
  ('20', 'Cesar'),
  ('23', 'Córdoba'),
  ('25', 'Cundinamarca'),
  ('27', 'Chocó'),
  ('41', 'Huila'),
  ('44', 'La Guajira'),
  ('47', 'Magdalena'),
  ('50', 'Meta'),
  ('52', 'Nariño'),
  ('54', 'Norte de Santander'),
  ('63', 'Quindío'),
  ('66', 'Risaralda'),
  ('68', 'Santander'),
  ('70', 'Sucre'),
  ('73', 'Tolima'),
  ('76', 'Valle del Cauca'),
  ('81', 'Arauca'),
  ('85', 'Casanare'),
  ('86', 'Putumayo'),
  ('88', 'San Andrés y Providencia'),
  ('91', 'Amazonas'),
  ('94', 'Guainía'),
  ('95', 'Guaviare'),
  ('97', 'Vaupés'),
  ('99', 'Vichada')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED: Main Municipalities (capitals + major cities)
-- ============================================================================
INSERT INTO public.dian_municipalities (code, department_code, name) VALUES
  -- Bogotá
  ('11001', '11', 'Bogotá D.C.'),
  -- Antioquia
  ('05001', '05', 'Medellín'),
  ('05002', '05', 'Abejorral'),
  ('05004', '05', 'Abriaquí'),
  ('05021', '05', 'Alejandría'),
  ('05030', '05', 'Amagá'),
  ('05031', '05', 'Amalfi'),
  ('05034', '05', 'Andes'),
  ('05036', '05', 'Angelópolis'),
  ('05038', '05', 'Angostura'),
  ('05040', '05', 'Anorí'),
  ('05042', '05', 'Apartadó'),
  ('05044', '05', 'Arboletes'),
  ('05045', '05', 'Argelia'),
  ('05051', '05', 'Armenia (Ant.)'),
  ('05055', '05', 'Barbosa'),
  ('05059', '05', 'Bello'),
  ('05079', '05', 'Betania'),
  ('05086', '05', 'Betulia'),
  ('05088', '05', 'Ciudad Bolívar'),
  ('05091', '05', 'Briceño'),
  ('05093', '05', 'Buriticá'),
  ('05101', '05', 'Cáceres'),
  ('05107', '05', 'Caldas'),
  ('05113', '05', 'Campamento'),
  ('05120', '05', 'Cañasgordas'),
  ('05125', '05', 'Caracolí'),
  ('05129', '05', 'Caramanta'),
  ('05134', '05', 'Carepa'),
  ('05138', '05', 'Carolina del Príncipe'),
  ('05142', '05', 'Caucasia'),
  ('05145', '05', 'Chigorodó'),
  ('05147', '05', 'Cisneros'),
  ('05148', '05', 'Cocorná'),
  ('05150', '05', 'Concepción'),
  ('05154', '05', 'Concordia'),
  ('05172', '05', 'Copacabana'),
  ('05190', '05', 'Dabeiba'),
  ('05197', '05', 'Don Matías'),
  ('05206', '05', 'Ebéjico'),
  ('05209', '05', 'El Bagre'),
  ('05212', '05', 'El Carmen de Viboral'),
  ('05234', '05', 'El Peñol'),
  ('05237', '05', 'El Retiro'),
  ('05240', '05', 'El Santuario'),
  ('05250', '05', 'Envigado'),
  ('05264', '05', 'Fredonia'),
  ('05266', '05', 'Frontino'),
  ('05282', '05', 'Giraldo'),
  ('05284', '05', 'Girardota'),
  ('05306', '05', 'Granada'),
  ('05308', '05', 'Guadalupe'),
  ('05310', '05', 'Guarne'),
  ('05313', '05', 'Guatapé'),
  ('05315', '05', 'Heliconia'),
  ('05318', '05', 'Hispania'),
  ('05321', '05', 'Itagüí'),
  ('05347', '05', 'Jardín'),
  ('05353', '05', 'Jericó'),
  ('05360', '05', 'La Ceja'),
  ('05361', '05', 'La Estrella'),
  ('05364', '05', 'La Pintada'),
  ('05368', '05', 'La Unión'),
  ('05376', '05', 'Liborina'),
  ('05380', '05', 'Maceo'),
  ('05390', '05', 'Marinilla'),
  ('05400', '05', 'Montebello'),
  ('05440', '05', 'Nechí'),
  ('05467', '05', 'Olaya'),
  ('05475', '05', 'Peque'),
  ('05480', '05', 'Pueblorrico'),
  ('05490', '05', 'Puerto Berrío'),
  ('05495', '05', 'Puerto Nare'),
  ('05501', '05', 'Puerto Triunfo'),
  ('05541', '05', 'Remedios'),
  ('05543', '05', 'Rionegro'),
  ('05576', '05', 'Sabaneta'),
  ('05579', '05', 'Salgar'),
  ('05585', '05', 'San Andrés de Cuerquia'),
  ('05591', '05', 'San Carlos'),
  ('05604', '05', 'San Francisco'),
  ('05607', '05', 'San Jerónimo'),
  ('05615', '05', 'San José de la Montaña'),
  ('05628', '05', 'San Juan de Urabá'),
  ('05631', '05', 'San Luis'),
  ('05642', '05', 'San Pedro de los Milagros'),
  ('05647', '05', 'San Pedro de Urabá'),
  ('05649', '05', 'San Rafael'),
  ('05652', '05', 'San Roque'),
  ('05656', '05', 'San Vicente Ferrer'),
  ('05658', '05', 'Santa Bárbara'),
  ('05659', '05', 'Santa Rosa de Osos'),
  ('05660', '05', 'Santo Domingo'),
  ('05664', '05', 'Segovia'),
  ('05665', '05', 'Sonsón'),
  ('05667', '05', 'Sopetrán'),
  ('05670', '05', 'Támesis'),
  ('05674', '05', 'Tarazá'),
  ('05679', '05', 'Tarso'),
  ('05686', '05', 'Titiribí'),
  ('05690', '05', 'Toledo'),
  ('05697', '05', 'Turbo'),
  ('05736', '05', 'Uramita'),
  ('05756', '05', 'Urrao'),
  ('05761', '05', 'Valdivia'),
  ('05789', '05', 'Valparaíso'),
  ('05790', '05', 'Vegachí'),
  ('05792', '05', 'Venecia'),
  ('05809', '05', 'Yalí'),
  ('05819', '05', 'Yarumal'),
  ('05837', '05', 'Yolombó'),
  ('05842', '05', 'Yondó'),
  ('05847', '05', 'Zaragoza'),
  -- Atlántico
  ('08001', '08', 'Barranquilla'),
  ('08078', '08', 'Baranoa'),
  ('08137', '08', 'Campo de la Cruz'),
  ('08141', '08', 'Candelaria'),
  ('08296', '08', 'Galapa'),
  ('08372', '08', 'Juan de Acosta'),
  ('08421', '08', 'Luruaco'),
  ('08433', '08', 'Malambo'),
  ('08436', '08', 'Manatí'),
  ('08520', '08', 'Palmar de Varela'),
  ('08549', '08', 'Piojó'),
  ('08558', '08', 'Polonuevo'),
  ('08560', '08', 'Ponedera'),
  ('08573', '08', 'Puerto Colombia'),
  ('08606', '08', 'Repelón'),
  ('08634', '08', 'Sabanagrande'),
  ('08638', '08', 'Sabanalarga'),
  ('08675', '08', 'Santa Lucía'),
  ('08685', '08', 'Santo Tomás'),
  ('08758', '08', 'Soledad'),
  ('08770', '08', 'Suan'),
  ('08832', '08', 'Tubará'),
  ('08849', '08', 'Usiacurí'),
  -- Bolívar
  ('13001', '13', 'Cartagena de Indias'),
  ('13006', '13', 'Achí'),
  ('13030', '13', 'Altos del Rosario'),
  ('13042', '13', 'Arenal'),
  ('13052', '13', 'Arjona'),
  ('13062', '13', 'Arroyohondo'),
  ('13074', '13', 'Barranco de Loba'),
  ('13140', '13', 'Calamar'),
  ('13160', '13', 'Cantagallo'),
  ('13188', '13', 'Cicuco'),
  ('13212', '13', 'Córdoba'),
  ('13222', '13', 'Clemencia'),
  ('13244', '13', 'El Carmen de Bolívar'),
  ('13248', '13', 'El Guamo'),
  ('13268', '13', 'El Peñón'),
  ('13300', '13', 'Hatillo de Loba'),
  ('13430', '13', 'Magangué'),
  ('13433', '13', 'Mahates'),
  ('13440', '13', 'Margarita'),
  ('13442', '13', 'María la Baja'),
  ('13468', '13', 'Mompós'),
  ('13473', '13', 'Montecristo'),
  ('13490', '13', 'Morales'),
  ('13549', '13', 'Pinillos'),
  ('13580', '13', 'Regidor'),
  ('13600', '13', 'Río Viejo'),
  ('13620', '13', 'San Cristóbal'),
  ('13647', '13', 'San Estanislao'),
  ('13650', '13', 'San Fernando'),
  ('13654', '13', 'San Jacinto'),
  ('13655', '13', 'San Jacinto del Cauca'),
  ('13657', '13', 'San Juan Nepomuceno'),
  ('13667', '13', 'San Martín de Loba'),
  ('13670', '13', 'San Pablo'),
  ('13673', '13', 'Santa Catalina'),
  ('13683', '13', 'Santa Rosa'),
  ('13688', '13', 'Santa Rosa del Sur'),
  ('13744', '13', 'Simití'),
  ('13760', '13', 'Soplaviento'),
  ('13780', '13', 'Talaigua Nuevo'),
  ('13810', '13', 'Tiquisio'),
  ('13836', '13', 'Turbaco'),
  ('13838', '13', 'Turbaná'),
  ('13873', '13', 'Villanueva'),
  ('13894', '13', 'Zambrano'),
  -- Boyacá
  ('15001', '15', 'Tunja'),
  ('15187', '15', 'Chiquinquirá'),
  ('15238', '15', 'Duitama'),
  ('15759', '15', 'Sogamoso'),
  ('15491', '15', 'Paipa'),
  ('15837', '15', 'Villa de Leyva'),
  -- Caldas
  ('17001', '17', 'Manizales'),
  ('17174', '17', 'Chinchiná'),
  ('17380', '17', 'La Dorada'),
  ('17873', '17', 'Villamaría'),
  -- Caquetá
  ('18001', '18', 'Florencia'),
  -- Cauca
  ('19001', '19', 'Popayán'),
  ('19698', '19', 'Santander de Quilichao'),
  -- Cesar
  ('20001', '20', 'Valledupar'),
  ('20013', '20', 'Aguachica'),
  -- Córdoba
  ('23001', '23', 'Montería'),
  ('23162', '23', 'Cereté'),
  ('23417', '23', 'Lorica'),
  ('23660', '23', 'Sahagún'),
  -- Cundinamarca
  ('25001', '25', 'Agua de Dios'),
  ('25126', '25', 'Cajicá'),
  ('25175', '25', 'Chía'),
  ('25214', '25', 'Cota'),
  ('25269', '25', 'Facatativá'),
  ('25286', '25', 'Funza'),
  ('25290', '25', 'Fusagasugá'),
  ('25295', '25', 'Gachancipá'),
  ('25307', '25', 'Girardot'),
  ('25377', '25', 'La Calera'),
  ('25386', '25', 'La Mesa'),
  ('25430', '25', 'Madrid'),
  ('25473', '25', 'Mosquera'),
  ('25754', '25', 'Soacha'),
  ('25758', '25', 'Sopó'),
  ('25769', '25', 'Tabio'),
  ('25785', '25', 'Tenjo'),
  ('25799', '25', 'Tocancipá'),
  ('25899', '25', 'Zipaquirá'),
  -- Chocó
  ('27001', '27', 'Quibdó'),
  -- Huila
  ('41001', '41', 'Neiva'),
  ('41396', '41', 'La Plata'),
  ('41551', '41', 'Pitalito'),
  ('41298', '41', 'Garzón'),
  -- La Guajira
  ('44001', '44', 'Riohacha'),
  ('44430', '44', 'Maicao'),
  -- Magdalena
  ('47001', '47', 'Santa Marta'),
  ('47189', '47', 'Ciénaga'),
  -- Meta
  ('50001', '50', 'Villavicencio'),
  ('50006', '50', 'Acacías'),
  ('50313', '50', 'Granada'),
  -- Nariño
  ('52001', '52', 'Pasto'),
  ('52356', '52', 'Ipiales'),
  ('52835', '52', 'Tumaco'),
  -- Norte de Santander
  ('54001', '54', 'Cúcuta'),
  ('54498', '54', 'Ocaña'),
  ('54518', '54', 'Pamplona'),
  -- Quindío
  ('63001', '63', 'Armenia'),
  ('63130', '63', 'Calarcá'),
  ('63401', '63', 'La Tebaida'),
  ('63470', '63', 'Montenegro'),
  -- Risaralda
  ('66001', '66', 'Pereira'),
  ('66170', '66', 'Dosquebradas'),
  ('66682', '66', 'Santa Rosa de Cabal'),
  -- Santander
  ('68001', '68', 'Bucaramanga'),
  ('68081', '68', 'Barrancabermeja'),
  ('68276', '68', 'Floridablanca'),
  ('68307', '68', 'Girón'),
  ('68547', '68', 'Piedecuesta'),
  ('68615', '68', 'San Gil'),
  -- Sucre
  ('70001', '70', 'Sincelejo'),
  ('70215', '70', 'Corozal'),
  -- Tolima
  ('73001', '73', 'Ibagué'),
  ('73268', '73', 'Espinal'),
  ('73449', '73', 'Melgar'),
  -- Valle del Cauca
  ('76001', '76', 'Cali'),
  ('76109', '76', 'Buenaventura'),
  ('76111', '76', 'Buga'),
  ('76130', '76', 'Candelaria'),
  ('76147', '76', 'Cartago'),
  ('76243', '76', 'El Cerrito'),
  ('76275', '76', 'Florida'),
  ('76318', '76', 'Guacarí'),
  ('76364', '76', 'Jamundí'),
  ('76520', '76', 'Palmira'),
  ('76834', '76', 'Tuluá'),
  ('76892', '76', 'Yumbo'),
  -- Arauca
  ('81001', '81', 'Arauca'),
  -- Casanare
  ('85001', '85', 'Yopal'),
  ('85010', '85', 'Aguazul'),
  -- Putumayo
  ('86001', '86', 'Mocoa'),
  -- San Andrés
  ('88001', '88', 'San Andrés'),
  ('88564', '88', 'Providencia'),
  -- Amazonas
  ('91001', '91', 'Leticia'),
  -- Guainía
  ('94001', '94', 'Inírida'),
  -- Guaviare
  ('95001', '95', 'San José del Guaviare'),
  -- Vaupés
  ('97001', '97', 'Mitú'),
  -- Vichada
  ('99001', '99', 'Puerto Carreño')
ON CONFLICT (code) DO NOTHING;
