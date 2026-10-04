"""Build the DTF exhibit in Blender. Metres, 24 fps, condensed process dwell times.
Run: blender --background --python assets/estamparia/assets/criar_animacao_dtf.py
Original machine shells are preserved; internal feed components are illustrative.
"""
import bpy
import json
import math
import random
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[3]
ASSETS=ROOT/'assets/estamparia/assets'
FPS=24
END=42
PX=-2.25
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ASSETS/'personalizacao_animada.glb'))
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()
for obj in list(bpy.data.objects):obj.animation_data_clear()
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
shirt=bpy.data.objects['CAMISETA_ANIMADA']
press=bpy.data.objects['TEKMAK_PRENSA_INDUSTRIAL_FRENTE_VERSO']
tray=bpy.data.objects['BANDEJA_MOVEL_DIANTEIRA']
rear=bpy.data.objects['BANDEJA_MOVEL_TRASEIRA']
plate=bpy.data.objects['Placa térmica']
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/TEKMAK_DTF_COMPACTA.glb'))
printer_source=bpy.data.objects['TEKMAK_DTF_COMPACTA | Produto completo']
printer_source.name='CARCACA_TK3002I'
bpy.context.view_layer.update()
printer_meshes=[o for o in [printer_source,*printer_source.children_recursive] if o.type=='MESH']
for obj in printer_meshes:
    world=obj.matrix_world.copy();obj.parent=None;obj.data.transform(world);obj.matrix_world=Matrix.Identity(4)
printer=bpy.data.objects.new('IMPRESSORA_TK3002I_DTF',None)
bpy.context.scene.collection.objects.link(printer)
for obj in printer_meshes:obj.parent=printer
printer.location.x=PX
scene=bpy.context.scene
scene.name='Ciclo_DTF_TK3002I'
scene.render.fps=FPS
scene.frame_start=0
scene.frame_end=END*FPS

def mat(name,color,metallic=0,roughness=.45,alpha=1):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,alpha);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,alpha)
    p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=roughness;p.inputs['Alpha'].default_value=alpha
    if alpha<1:m.surface_render_method='DITHERED'
    m.use_backface_culling=False
    return m

def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=parent;o.location=loc
    return o

def parent_world(obj,parent):
    bpy.context.view_layer.update();world=obj.matrix_world.copy();obj.parent=parent;obj.matrix_world=world

def key(obj,t,**values):
    for prop,value in values.items():setattr(obj,prop,value);obj.keyframe_insert(data_path=prop,frame=round(t*FPS))

def curves(obj,interpolation='BEZIER'):
    if not obj.animation_data or not obj.animation_data.action:return
    ad=obj.animation_data
    for layer in ad.action.layers:
        for strip in layer.strips:
            bag=strip.channelbag(ad.action_slot)
            if not bag:continue
            for curve in bag.fcurves:
                for k in curve.keyframe_points:k.interpolation=interpolation;k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'

def box(name,loc,size,material,parent=None,bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Raio de fabricação','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in o.data.polygons:p.use_smooth=True
        mod=o.modifiers.new('Normais','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    if parent:parent_world(o,parent)
    return o

def cylinder(name,loc,radius,depth,material,parent=None,axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;o.name=name
    if axis=='X':
        o.rotation_euler.y=math.pi/2
        # Bake the cylinder alignment before animating its axle. Combining
        # this Y rotation with animated Euler X made the whole roller swivel.
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
    o.data.materials.append(material)
    mod=o.modifiers.new('Arestas arredondadas','BEVEL');mod.width=min(.003,radius*.12);mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
    if parent:parent_world(o,parent)
    return o

def text_object(name,content,loc,size,material,parent=None):
    bpy.ops.object.select_all(action='DESELECT')
    d=bpy.data.curves.new(name,'FONT');d.body=content;d.size=size;d.align_x='CENTER';d.align_y='CENTER';d.extrude=.0001;d.materials.append(material)
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.select_set(False)
    if parent:parent_world(o,parent)
    return o

ivory=mat('Polímero acetinado',(.83,.85,.86),roughness=.34)
black=mat('Polímero grafite',(.017,.021,.027),roughness=.42)
steel=mat('Aço dos roletes',(.38,.42,.46),.8,.23)
rubber=mat('Borracha de tração',(.025,.028,.033),roughness=.8)
ink_specs=[('C',(0,.48,.75)),('M',(.72,.005,.20)),('Y',(.98,.65,.01)),('K',(.018,.021,.025)),('W',(.94,.94,.9))]
ink_mats=[mat('Tinta '+n,c,roughness=.29) for n,c in ink_specs]

# Measured reservoir coordinates. Bottle rotates around its mouth, keeping the pour aligned.
supplies=empty('ABASTECIMENTO',parent=printer)
tank=Vector((PX-.4771,.2065,1.779));mouth=tank+Vector((0,0,.092))
bottle=empty('FRASCO_CIANO',mouth)
for name,z,r,d,m in [('Corpo',-.13,.043,.18,ivory),('Ombro',-.033,.038,.032,ivory),('Gargalo',-.008,.018,.028,ivory),('Faixa C',-.13,.0434,.084,ink_mats[0])]:
    cylinder(name,tuple(mouth+Vector((0,0,z))),r,d,m,bottle)
text_object('Rótulo C','C',tuple(mouth+Vector((0,-.044,-.13))),.045,ivory,bottle)
glove=mat('Luva de operação',(.07,.095,.11),roughness=.75)
box('Luva | palma',tuple(mouth+Vector((.059,0,-.14))),(.038,.092,.1),glove,bottle,.018)
for i in range(4):box('Luva | dedo '+str(i),tuple(mouth+Vector((.029,-.034+i*.022,-.125))),(.075,.017,.024),glove,bottle,.008)
box('Luva | polegar',tuple(mouth+Vector((.032,.044,-.177))),(.072,.023,.028),glove,bottle,.009)
box('Manga do operador',tuple(mouth+Vector((.18,0,-.145))),(.24,.085,.095),black,bottle,.019)
parent_world(bottle,supplies)
p=Vector((-.4771,.2065,1.871))
for t,loc,angle in [(0,p+Vector((-.28,0,.22)),0),(.7,p+Vector((-.18,0,.22)),.25),(1.65,p,2.75),(4.4,p,2.75),(5.3,p+Vector((-.18,0,.22)),.25),(6,p+Vector((-.3,0,.5)),0)]:key(bottle,t,location=loc,rotation_euler=(0,angle,0))
for t,s in [(0,.001),(.35,1),(5.4,1),(6,.001)]:key(bottle,t,scale=(s,)*3)
stream=cylinder('FLUXO_CIANO',tuple(tank+Vector((0,0,.046))),.003,.087,ink_mats[0],supplies)
for t,s in [(0,.001),(1.65,.001),(1.85,1),(4.2,1),(4.4,.001)]:key(stream,t,scale=(s,s,1))
for i,ink_mat in enumerate(ink_mats):
    x=PX-.4771+i*.0932;y=.178+i*.00325
    box('Identificação reservatório '+ink_specs[i][0],(x,y,1.673),(.012,.002,.091),ink_mat,supplies,.001)
    text_object('Canal '+ink_specs[i][0],ink_specs[i][0],(x,y-.002,1.727),.021,black,supplies)

# Extract the actual cyan tank cap from the original mesh and animate its removal.
mesh=printer_meshes[0]
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_mode(type='FACE')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')
for poly in mesh.data.polygons:
    c=poly.center;poly.select=(-.511<c.x<-.443 and .175<c.y<.24 and 1.766<c.z<1.786)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
cap_parts=[o for o in bpy.context.selected_objects if o!=mesh]
for cap in cap_parts:
    cap.name='TAMPA_RESERVATORIO_CIANO';base=cap.location.copy()
    for t,d in [(0,(0,0,0)),(.7,(0,0,.08)),(1.3,(-.09,0,.1)),(4.9,(-.09,0,.1)),(5.5,(0,0,.08)),(6,(0,0,0))]:key(cap,t,location=base+Vector(d))

# Print carriage traverses above a stationary feed bed; film advances between passes.
mechanics=empty('MECANISMO_DTF',parent=printer)
box('Trilho linear do cabeçote',(PX-.08,.10,1.315),(.64,.024,.026),steel,mechanics)
head=empty('CARRO_CABECOTES',(PX-.25,.06,1.25))
box('Carro | estrutura',(PX-.25,.06,1.25),(.085,.08,.092),black,head,.007)
for i in range(2):box('Cabeça Epson '+str(i+1),(PX-.276+i*.047,.046,1.19),(.036,.066,.018),steel,head,.002)
parent_world(head,mechanics)
key(head,0,location=(-.25,.06,1.25));key(head,7,location=(-.25,.06,1.25))
for i in range(17):key(head,7.5+i*.38,location=((-.24 if i%2==0 else .08),.06,1.25))
key(head,14.1,location=(-.25,.06,1.25));curves(head,'LINEAR')
for i,(y,z) in enumerate([(.08,1.12),(-.10,.96),(-.38,.815),(-1.16,.704)]):
    roll=cylinder('ROLETE_TRACAO_'+str(i),(PX-.08,y,z),.017,.35,rubber,mechanics,'X')
    key(roll,7,rotation_euler=(0,0,0));key(roll,20,rotation_euler=(12*math.pi,0,0));curves(roll,'LINEAR')

# Continuous PET web enters the integrated powder shaker and curing tunnel.
route=[(.38,1.143),(.07,1.143),(-.06,1.06),(-.13,.925),(-.30,.87),(-.42,.82),(-.94,.73),(-1.17,.73),(-1.32,.68)]
route_lengths=[0]
for a,b in zip(route,route[1:]):route_lengths.append(route_lengths[-1]+math.dist(a,b))
def feed(s):
    s=max(0,min(route_lengths[-1],s))
    for i in range(len(route)-1):
        if s<=route_lengths[i+1]:
            u=(s-route_lengths[i])/(route_lengths[i+1]-route_lengths[i])
            return Vector((PX-.08,route[i][0]*(1-u)+route[i+1][0]*u,route[i][1]*(1-u)+route[i+1][1]*u))
    return Vector((PX-.08,*route[-1]))
pet=mat('Filme PET translúcido',(.73,.8,.83),roughness=.24,alpha=.30)
color_mat=mat('Arte DTF editável no navegador',(1,1,1),roughness=.46)
white_mat=mat('Branco de cobertura DTF',(1,1,.98),roughness=.67);white_mat.use_backface_culling=True

def strip_mesh(name,width,length,material,point_fn,rows=40):
    vertices=[];faces=[]
    for j in range(rows+1):
        for x in [-width/2,width/2]:vertices.append(tuple(point_fn(x,j/rows)))
    for j in range(rows):faces.append((j*2,j*2+1,j*2+3,j*2+2))
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);data.materials.append(material)
    uv=data.uv_layers.new()
    for poly in data.polygons:
        for li in poly.loop_indices:
            vi=data.loops[li].vertex_index;uv.data[li].uv=(vi%2,(vi//2)/rows)
    return obj
ribbon=strip_mesh('BOBINA_PET_EM_PERCURSO',.31,route_lengths[-1],pet,lambda x,v:feed(v*route_lengths[-1])+Vector((x,0,0)),80)
parent_world(ribbon,mechanics)
film_root=empty('FILME_TRANSFER_DTF')
ROWS=40
feed_keys=[(7,.08),(8,.24),(10,.36),(12,.47),(14,.6),(15,.8),(16,1.0),(17,1.15),(18,1.38),(19,1.57),(20,route_lengths[-1]-.11)]
for name,material,z,width,length in [('Suporte PET',pet,0,.30,.216),('ARTE_USUARIO_NO_FILME',color_mat,.0005,.2752,.17773),('BRANCO_SOBRE_A_ARTE',white_mat,.0008,.2752,.17773)]:
    obj=strip_mesh(name,width,length,material,lambda x,v:Vector((x,(v-.5)*length,z)),ROWS)
    obj.parent=film_root;obj.shape_key_add(name='Basis')
    for j,(t,s) in enumerate(feed_keys):
        shape=obj.shape_key_add(name='Avanço_'+str(j))
        for k,vtx in enumerate(shape.data):
            x=(-width/2,width/2)[k%2];v=(k//2)/ROWS;vtx.co=feed(s+(v-.5)*length)+Vector((x,0,z))
        shape.value=0;shape.keyframe_insert('value',frame=0)
        if j:shape.keyframe_insert('value',frame=round(feed_keys[j-1][0]*FPS))
        shape.value=1;shape.keyframe_insert('value',frame=round(t*FPS))
        if j==len(feed_keys)-1:
            shape.keyframe_insert('value',frame=round(20.04*FPS));shape.value=0;shape.keyframe_insert('value',frame=round(20.08*FPS))
        else:
            shape.value=0;shape.keyframe_insert('value',frame=round(feed_keys[j+1][0]*FPS))
    keys=obj.data.shape_keys
    for layer in keys.animation_data.action.layers:
        for strip in layer.strips:
            for curve in strip.channelbag(keys.animation_data.action_slot).fcurves:
                for k in curve.keyframe_points:k.interpolation='LINEAR'
    # Low-angle progressive peel bends the PET while the ink stays on the textile.
    for j,p in enumerate([.2,.4,.6,.8,1]):
        shape=obj.shape_key_add(name='Despeliculagem_'+str(j));crease=length/2-p*length;radius=.022
        for k,vtx in enumerate(shape.data):
            x=(-width/2,width/2)[k%2];y=((k//2)/ROWS-.5)*length;s=max(0,y-crease);angle=min(math.pi,s/radius)
            if s:y=crease+radius*math.sin(angle)-max(0,s-math.pi*radius)
            vtx.co=(x,y,z-radius*(1-math.cos(angle)))
        shape.value=0;shape.keyframe_insert('value',frame=round((35.8+j*.36)*FPS))
        shape.value=1;shape.keyframe_insert('value',frame=round((36.16+j*.36)*FPS))
        if j<4:shape.value=0;shape.keyframe_insert('value',frame=round((36.52+j*.36)*FPS))

powder_mat=mat('Pó termocolante',(.85,.86,.81),roughness=.92)
powder=empty('APLICADOR_PO',parent=mechanics)
box('Dosador na entrada do shaker',(PX-.08,-.255,.942),(.35,.085,.05),steel,powder)
rng=random.Random(19)
for i in range(42):
    x=PX-.08+rng.uniform(-.14,.14);y=-.255+rng.uniform(-.02,.02);z=.904+rng.uniform(0,.008)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.0018,location=(x,y,z))
    grain=bpy.context.object;grain.name='GRAO_ADESIVO_'+str(i);grain.data.materials.append(powder_mat);parent_world(grain,powder)
    origin=grain.location.copy();key(grain,0,scale=(0,)*3)
    for n in range(4):
        t=14.2+n*.45+(i%7)*.027
        key(grain,t,location=origin,scale=(1,)*3);key(grain,t+.3,location=origin+Vector((0,0,-.018)),scale=(1,)*3);key(grain,t+.33,scale=(0,)*3)
    curves(grain,'LINEAR')
heat_mat=mat('Indicador de cura',(.6,.1,.015),roughness=.45)
box('FORNO_INDICADOR',(PX-.08,-1.099,.717),(.31,.003,.013),heat_mat,mechanics,.002)

# Both shuttle trays move together; fabric and transfer share the tray displacement.
load_y=-1.04;cloth_scale=.86;bed_z=.937
shirt.rotation_mode='XYZ';shirt.rotation_euler=(math.pi/2,0,math.pi);shirt.scale=(cloth_scale,cloth_scale*.18,cloth_scale);shirt.location=(0,load_y,bed_z)
tray_base=tray.location.copy();rear_base=rear.location.copy()
shifts=[(0,0),(22,0),(23.25,.68),(26,.68),(27.25,0),(29,0),(30.25,.68),(34.1,.68),(35.35,0),(END,0)]
for t,d in shifts:
    key(tray,t,location=tray_base+Vector((0,d,0)));key(rear,t,location=rear_base+Vector((0,d,0)));key(shirt,t,location=(0,load_y+d,bed_z))
for t,z in [(0,.09),(23.3,.09),(23.9,.0215),(25.25,.0215),(25.85,.09),(30.3,.09),(30.9,.0215),(33.2,.0215),(33.85,.09),(END,.09)]:key(plate,t,location=(0,0,z))
film_y=load_y+cloth_scale*(.565-.2066667/2)
for t,loc,rot,s in [(0,(0,0,0),(0,0,0),.001),(7,(0,0,0),(0,0,0),1),(20.04,(0,0,0),(0,0,0),1),(20.08,(0,film_y,.953),(math.pi,0,0),.001),(27.8,(0,film_y,.953),(math.pi,0,0),.001),(28,(0,film_y,.953),(math.pi,0,0),1)]:key(film_root,t,location=loc,rotation_euler=rot,scale=(s,)*3)
for t,d in [(29,0),(30.25,.68),(34.1,.68),(35.35,0),(37.8,0)]:key(film_root,t,location=(0,film_y+d,.953))
key(film_root,38.4,location=(0,film_y-.10,1.10),scale=(1,)*3);key(film_root,38.9,scale=(.001,)*3)
# Dissolve to a standing product shot. No unsupported flight off the platen.
key(shirt,39.5,rotation_euler=(math.pi/2,0,math.pi),scale=(cloth_scale,cloth_scale*.18,cloth_scale),location=(0,load_y,bed_z))
key(shirt,39.55,rotation_euler=(0,0,0),scale=(cloth_scale,)*3,location=(0,-1.55,.9))
key(shirt,END,rotation_euler=(0,0,0),scale=(cloth_scale,)*3,location=(0,-1.55,.9))
for obj in [shirt,tray,rear,plate,bottle,stream,film_root,*cap_parts]:curves(obj)

world=bpy.data.worlds.new('Estúdio grafite');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.12,.14,.18,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35;scene.world=world
def aim(obj,p):obj.rotation_euler=(Vector(p)-obj.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Softbox principal',(-2,-4,5),850,4),('Softbox lateral',(3,-1,4),600,3),('Recorte',(-2,3,4),1000,3)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    obj=bpy.data.objects.new(name,d);scene.collection.objects.link(obj);obj.location=loc;aim(obj,(-1,0,1))
floor=box('PISO_ESTUDIO',(-1,0,-.035),(200,200,.05),mat('Piso grafite',(.023,.03,.042),roughness=.65),bevel=0)
camera_data=bpy.data.cameras.new('Câmera do ciclo');camera_data.lens=48
cam=bpy.data.objects.new('Câmera do ciclo',camera_data);scene.collection.objects.link(cam);scene.camera=cam
shots=[
 (0,(-1.45,-3.45,2.5),(-2.4,-.05,1.10)),(.8,(-2.02,-1.02,2.27),(-2.65,.19,1.85)),(5.1,(-2.02,-1.02,2.27),(-2.65,.19,1.85)),
 (6.5,(-1.40,-3.3,2.45),(-2.4,-.40,1.04)),(7.5,(-1.68,-1.35,1.78),(-2.33,-.05,1.22)),(13.8,(-1.72,-1.30,1.73),(-2.33,-.07,1.19)),
 (15.2,(-1.75,-1.20,1.45),(-2.33,-.32,1.02)),(17,(-1.38,-2.38,1.43),(-2.33,-.95,.72)),(20,(-1.45,-2.48,1.42),(-2.33,-1.16,.73)),
 (20.1,(1.65,-2.6,2.55),(0,-.38,.91)),(27,(.60,-1.80,2.30),(0,-.66,.95)),(29,(.60,-1.80,2.30),(0,-.66,.95)),
 (30.2,(1.15,-1.90,1.45),(0,-.05,1.0)),(34,(1.15,-1.90,1.45),(0,-.05,1.0)),(35.8,(.24,-1.64,1.68),(0,-.64,.95)),
 (38.8,(.24,-1.64,1.68),(0,-.64,.95)),(39.5,(.24,-1.64,1.68),(0,-.64,.95)),(39.6,(0,-2.98,1.20),(0,-1.55,1.20)),(42,(0,-2.98,1.20),(0,-1.55,1.20))]
for t,pos,target in shots:cam.location=pos;aim(cam,target);cam.keyframe_insert('location',frame=round(t*FPS));cam.keyframe_insert('rotation_euler',frame=round(t*FPS))
curves(cam)
for t,name in [(0,'01 Abastecimento manual'),(7,'PAUSA: criar arte'),(8,'02 Impressão espelhada CMYK'),(13,'Branco sobre a arte'),(14.2,'Pó termocolante'),(16,'Cura no forno'),(20,'PAUSA: escolher camiseta'),(20.1,'03 Camiseta apoiada na bandeja'),(23.9,'Pré-prensagem'),(28,'Posicionamento manual do filme'),(30.9,'Transferência térmica'),(35.4,'Resfriamento'),(36,'Despeliculagem'),(39.6,'04 Produto pronto')]:scene.timeline_markers.new(name,frame=round(t*FPS))
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=64
scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
scene['process_note']='Demonstração DTF com tempos condensados. Ajustes térmicos dependem de filme, pó e tecido. Abastecimento e posicionamento são operações manuais.'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
scene.frame_set(0);bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS/'personalizacao_dtf.blend'),compress=True)
def three(p):return [round(p[0],4),round(p[2],4),round(-p[1],4)]
metadata={'fps':FPS,'duration':END,'prepareEnds':7,'inkLoaded':6,'printStarts':7,'printProgress':8,
 'whiteStarts':12,'powderStarts':14.2,'cureStarts':16,'colorChoice':20,'shirtArrives':20.1,'prepressStarts':23.9,
 'filmPlaced':28,'trayEnters':30.25,'pressCloses':30.9,'printAppears':33.85,'pressOpens':33.85,'trayExits':35.35,
 'filmPeels':35.8,'peelEnds':38.4,'revealStarts':39.5,'revealEnds':40.1,
 'shirt':shirt.name,'press':press.name,'printer':printer.name,'film':film_root.name,'filmArtwork':'ARTE_USUARIO_NO_FILME','filmWhite':'BRANCO_SOBRE_A_ARTE',
 'resultTarget':[0,1.20,1.55],'shots':[{'time':t,'position':three(p),'target':three(q)} for t,p,q in shots],
 'sources':['https://www.rolanddg.eu/blog/what-is-direct-to-film-printing'],'note':scene['process_note']}
(ASSETS/'ciclo.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf8')
bpy.data.objects.remove(floor,do_unlink=True)
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'personalizacao_dtf.next.glb'),export_format='GLB',export_animations=True,
 export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,export_skins=False,
 export_morph=True,export_morph_animation=True,export_apply=False,export_materials='EXPORT',export_cameras=False,export_lights=False)
(ASSETS/'personalizacao_dtf.next.glb').replace(ASSETS/'personalizacao_dtf.glb')
print('DTF_REALISTIC_EXPORT_COMPLETE')
