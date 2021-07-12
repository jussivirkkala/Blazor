# EDF

This is Blazor https://blazor.net  WebAssembly (WASM) project to read EDF https://www.edfplus.info/ header information. It is hosted on https://www.virkkala.net/blazor/edf.

There are minimal changes to 

![EDF-1](EDF-1.png)

Extra navigation are commented out using `@*` in MainLayout.razor

```
@inherits LayoutComponentBase

<div class="page">
    @*
        <div class="sidebar">
            <NavMenu />
        </div>
    *@
    <div class="main">
        @*
        <div class="top-row px-4">
            <a href="http://blazor.net" target="_blank" class="ml-md-auto">About</a>
        </div>
        *@
        <div class="content px-4">
            @Body
        </div>
    </div>
</div>
``` 
All other changes are done into Index.razor

End
