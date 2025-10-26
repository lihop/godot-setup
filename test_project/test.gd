extends Node


func _ready():
	if ClassDB.class_exists("CSharpScript"):
		var mono_scene = load("res://test_mono.tscn")
		add_child(mono_scene.instantiate())
	else:
		var non_mono_scene = load("res://test_non_mono.tscn")
		add_child(non_mono_scene.instantiate())
